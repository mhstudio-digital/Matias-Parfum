# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Matías Parfum es un catálogo e-commerce para una perfumería en Costa Rica. El sitio publicado sigue siendo HTML/CSS/JS estático servido por GitHub Pages (`matiasparfum.com`, dominio vía `CNAME`), pero **ya no se edita a mano**: `index.html` (el bloque de cards) y las 239 páginas de `productos/` se generan con `node build.js` a partir de una única fuente de datos, `productos.json`. Ver `README-DEV.md` para el flujo de edición día a día.

## Development

**Instalar dependencias** (solo `ejs`, para las plantillas):
```
npm install
```

**Regenerar el sitio después de editar `productos.json` o `templates/*.ejs`:**
```
npm run build
```

**Preview local** — abrí `index.html` directo en el navegador, o serví con cualquier static server:
```
npx serve .
```

**Deploy** — corré `npm run build`, revisá el `git diff`, y hacé push; GitHub Pages se encarga del resto.

No hay tests ni linters.

## Arquitectura de generación

| Archivo | Rol |
|---|---|
| `productos.json` | **Fuente única de verdad** de los 239 productos. Editar acá, nunca en el HTML generado. |
| `templates/card.ejs` | Plantilla de una `<div class="card">` del catálogo. |
| `templates/producto.ejs` | Plantilla completa de una página de `productos/`. |
| `build.js` | Lee `productos.json`, renderiza ambas plantillas y escribe el resultado. Ver detalle abajo. |
| `index.html` | Generado en parte: navbar, hero, filtros, quiz, carrito y footer siguen siendo HTML de mano; el bloque de cards entre `<!-- CARDS:START -->` y `<!-- CARDS:END -->` lo escribe `build.js`. |
| `productos/*.html` | 239 archivos, **generados enteros** por `build.js` desde `templates/producto.ejs`. No editar directamente — se sobrescriben en el próximo build. |
| `style.css` | Sin cambios: todos los estilos, compartido entre `index.html` y `productos/*.html`. Tokens en `:root`. |
| `scripts/extract-legacy-data.js` | Script de migración de una sola vez (ya ejecutado) que generó `productos.json` a partir del `index.html`/`productos/` originales. Queda como referencia histórica y para regenerar `_conflictos.md` si hace falta re-auditar; no forma parte del flujo normal de edición. |

`script.js` se eliminó: era código muerto (no lo cargaba ninguna página).

### Qué hace `build.js` exactamente

1. Lee `productos.json` (array de 239 objetos, en el mismo orden en que deben aparecer las cards).
2. Para cada producto, renderiza `templates/producto.ejs` y escribe `productos/{slug}.html`.
3. Renderiza `templates/card.ejs` para cada producto y reemplaza todo el contenido entre `<!-- CARDS:START -->` y `<!-- CARDS:END -->` en `index.html`.
4. Reemplaza el contador de fragancias (el literal `230` en meta description, OG tags y el hero-stat) por `productos.length`, **antes** de inyectar las cards nuevas (para no tocar por accidente un precio que contenga esos mismos dígitos).
5. Imprime cuántos productos procesó y cuántos archivos generó.

### Esquema de `productos.json`

```json
{
  "slug": "christian-dior-sauvage-200ml-edp",
  "nombre": "SAUVAGE",
  "nombreCompleto": "CHRISTIAN DIOR SAUVAGE 200ML EDP",
  "tituloCard": "CHRISTIAN DIOR SAUVAGE 200ML EDP",
  "breadcrumbFinal": "CHRISTIAN DIOR SAUVAGE",
  "marca": "Dior",
  "genero": "hombre",
  "familia": "Fresco Amaderado",
  "categoria": "frescos",
  "tamaño": "200ml",
  "concentracion": "EDP",
  "precio": 120000,
  "precioDesde": false,
  "imagen": "img/SAUVAGEEDP.jpg",
  "notas": ["Pimienta", "Ambroxan", "Bergamota"],
  "intensidad": 4,
  "duracion": "9 horas",
  "descripcion": "CHRISTIAN DIOR SAUVAGE 200ML EDP 100% original en Costa Rica. Familia Fresco Amaderado."
}
```

Campos que existen por fidelidad con el HTML legado (no por diseño ideal, sino porque el sitio original usaba textos distintos en distintos lugares de la misma página y hubo que preservarlos para que el HTML generado saliera idéntico):

- **`nombreCompleto`** — texto de `<h1 class="pp-title">` en la página de producto (todo en mayúsculas).
- **`tituloCard`** — texto original de la card en `index.html` (marca en Title Case). Se usa para `<title>`, meta description, `og:title`, el `"name"` del JSON-LD, el `alt` de la imagen y el mensaje de WhatsApp — **no** `nombreCompleto`. Son dos strings distintos en 232 de los 239 productos; confundirlos rompe el diff.
- **`breadcrumbFinal`** — el generador original armaba el último segmento del breadcrumb con una lógica inconsistente entre productos (a veces recorta "PARFUM"/"ELIXIR"/tamaño, a veces no, sin un patrón único). Se extrajo tal cual existe en cada página en lugar de intentar recalcularlo.
- **`categoria`** — bucket usado por el filtro (`frescos`/`florales`/`orientales`/`amaderados`), calculado desde `familia` con la misma lógica que corre en el `<script>` de `index.html`.
- **`precioDesde`** — `true` solo para el producto cuyo precio original se mostraba como "Desde ₡X" (varias presentaciones bajo una sola card).

### Convenciones de formato que las plantillas deben respetar

- El precio se muestra con **coma** como separador de miles en la card (`₡65,000`) y con **punto** en la página de producto (`₡65.000`) — son convenciones distintas del sitio original, no un error. `build.js` calcula ambas desde el mismo `precio` numérico; no usar `toLocaleString` (el resultado varía según el ICU de Node vs. el navegador).
- El `&` va sin escapar en `data-nombre`, `pp-title`, `src`, JSON-LD y el mensaje de WhatsApp, pero **sí** va como `&amp;` en `<title>`, meta description, `og:title`, el `alt` de `pp-img` y el breadcrumb. Es una inconsistencia real del sitio original que las plantillas replican a propósito.
- La imagen usa ruta relativa sin `/` inicial en la card (`img/x.jpg`) y con `/` inicial en la página de producto (`/img/x.jpg`); la URL absoluta de OG/JSON-LD usa `encodeURIComponent` sobre el nombre de archivo (espacios y `&` quedan percent-encoded).

### `_conflictos.md`

Documenta las inconsistencias reales encontradas al migrar los 239 productos del HTML viejo a `productos.json`: 2 productos con género distinto entre la card y la página (se usó el valor de la página), y **43 productos con la marca mal cargada como "Otra" u "Oud"** (placeholders del sitio original, no un error de la migración — están así en ambas fuentes). Vale la pena revisar y corregir esas 43 marcas directamente en `productos.json`.

## El resto del sitio (sin cambios respecto a antes de esta migración)

### Anatomía de una card generada

```html
<div class="card" data-nombre="…" data-tipo="Hombre" data-brand="…" data-familia="…" data-intensidad="4" data-duracion="8">
  <a href="productos/{slug}.html" class="card-image-wrap">…</a>
  <div class="card-body">
    <span class="card-brand">…</span>
    <h3 class="card-title"><a href="productos/{slug}.html">…</a></h3>
    <div class="card-meta">
      <span class="card-familia">…</span>
      <span class="card-notas">Nota1 · Nota2 · Nota3</span>
    </div>
    <p class="precio">₡65,000</p>
    <div class="card-buttons">
      <button class="consultar-btn" onclick="consultarPerfume('…')">Consultar por WhatsApp</button>
      <!-- el botón "+ Agregar al carrito" se inyecta por JS al cargar la página -->
    </div>
  </div>
</div>
```

Todas las cards viven dentro de una única `<div class="products-grid" id="productsGrid">`.

### Sistema de filtrado (client-side, `<script>` inline de `index.html`, sin cambios)

```js
let filtroActivo = 'todos';      // categoría/familia: todos | amaderados | florales | orientales | frescos
let generoActivo = 'todos';      // todos | Hombre | Mujer | Unisex
let busquedaActiva = '';         // texto libre del buscador
```

`_aplicarFiltros()` recorre cada `.card`, evalúa `_matchCat()` + `_matchGenero()` + `_matchBusqueda()` contra sus `data-*`, hace toggle de `display:none`, actualiza el badge de conteo (`#filterCount`) y el `.empty-state`. No existe comparador de productos ni modal `#compModal`.

### Carrito (localStorage)

Array `carrito` persistido en `localStorage['mpCarritoV2']`. Funciones clave: `agregarAlCarrito(card)`, `cambiarCantidad(idx, delta)`, `quitarItem(idx)`, `vaciarCarrito()`, `renderModal()`, `pedirPorWhatsApp()`. El botón "+ Agregar al carrito" se inyecta por JS en `DOMContentLoaded`.

### Quiz de perfil olfativo (`#quiz`)

Un solo paso: 6 tarjetas de perfil (`.quiz-card`, `data-perfil`). `seleccionarPerfil(perfil, el)` mapea el perfil a una categoría vía `QUIZ_MAP` y reutiliza `_matchCat()` para filtrar hasta 4 cards.

### Escena 3D del hero

`#escena-botella` usa Three.js (CDN, `three.min.js` r128) para una botella rotable con drag. Decorativo, no interactúa con el catálogo.

### CSS design tokens

```css
--bg / --bg2 / --bg3 / --bg4    /* fondos oscuros */
--gold / --gold-lt / --gold-dim /* acento dorado */
--cream / --stone                /* texto claro */
--serif   /* Cormorant Garamond */
--sans    /* DM Sans */
```

## Qué se puede cambiar globalmente vs. qué es único por producto

**Global:**
- Paleta, tipografías, layout de `.card` y de páginas de producto (`.pp-*`) → `style.css`.
- Estructura de la card o de la página de producto → `templates/card.ejs` / `templates/producto.ejs`, después `npm run build`.
- Lógica de carrito, filtros, quiz → `<script>` inline de `index.html`.

**Único por producto (vive en `productos.json`, ya no repartido en dos archivos):**
- Nombre, marca, familia, precio, notas, intensidad/duración, imagen, descripción SEO.

## Agregar un producto nuevo

Ver `README-DEV.md`. Resumen: imagen a `img/` → nuevo objeto en `productos.json` → `npm run build`.

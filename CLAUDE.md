# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Matías Parfum es un catálogo e-commerce estático (HTML/CSS/JS vanilla) para una perfumería en Costa Rica. Sin build system, sin package manager, sin framework — archivos servidos directamente por GitHub Pages en `matiasparfum.com` (dominio configurado vía `CNAME`).

## Development

**Preview local** — abrí `index.html` directo en el navegador, o serví con cualquier static server:
```
npx serve .
# o
python -m http.server 8080
```

**Deploy** — push a GitHub; GitHub Pages se encarga del resto.

No hay tests, linters ni build steps.

## File structure and architecture

| Archivo | Rol |
|---|---|
| `index.html` | Monolito (~5.950 líneas): navbar, hero con escena 3D, barra de filtros, las 239 product cards, mini-carrito + modal de pedido, quiz de perfil olfativo, sección "Nosotros", footer, y el `<script>` inline al final que contiene TODA la lógica del sitio |
| `style.css` | Todos los estilos (869 líneas), compartido entre `index.html` y `productos/*.html`. Tokens de color/tipografía en `:root` |
| `script.js` | **Código muerto.** No está enlazado desde ningún `<script src>` de `index.html` ni de `productos/*.html`. Es un remanente de una versión anterior del filtrado (funciones `filtrarTipo`, `obtenerMarca` por inferencia de texto, filtro por marca/precio con selects `#filtroMarca`/`#filtroPrecio` que ya no existen en el HTML). No editar esperando que tenga efecto — no se ejecuta. |
| `productos/*.html` | 239 páginas de producto, una por cada card de `index.html`. Layout `.pp-*` con topbar propio (no el navbar completo del sitio), split imagen/info. Comparten solo `style.css` (`/style.css`); cada una trae su propio `<script>` inline (idéntico entre sí salvo los datos) para cantidad y botón de WhatsApp |
| `img/` | Todas las imágenes de producto (~250 archivos), referenciadas directamente |

### ⚠️ Duplicación de datos: sin fuente única de verdad

Cada producto vive **en dos lugares independientes** que hay que mantener sincronizados a mano:
1. Su `<div class="card">` dentro de `index.html`.
2. Su archivo dedicado en `productos/`.

No hay JSON, CMS ni build step que genere uno a partir del otro. Cambiar un precio, agregar o borrar un producto implica editar ambos manualmente.

### Anatomía de una product card (en `index.html`)

```html
<div class="card"
  data-nombre="Jean Paul Gaultier Le Male"
  data-tipo="Hombre"          <!-- Hombre | Mujer | Unisex -->
  data-brand="Jean Paul Gaultier"
  data-familia="Oriental"     <!-- familia olfativa: Fresco, Oriental, Floral, Amaderado, etc. -->
  data-intensidad="4"         <!-- 1–5, no se usa en el filtrado actual -->
  data-duracion="8">          <!-- horas, no se usa en el filtrado actual -->
  <a href="productos/jean-paul-gaultier-le-male-100ml-edt.html" class="card-image-wrap">…</a>
  <div class="card-body">
    <span class="card-brand">…</span>
    <h3 class="card-title"><a href="productos/…">…</a></h3>
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

Todas las 239 cards viven dentro de una única `<div class="products-grid" id="productsGrid">` — no hay secciones separadas por género con IDs propios (`gridHombre`/`gridMujer` no existen); el género se filtra client-side vía `data-tipo`.

### Sistema de filtrado real (todo client-side, en el `<script>` inline de `index.html`)

Tres filtros combinables, con estado en variables globales:
```js
let filtroActivo = 'todos';      // categoría/familia: todos | amaderados | florales | orientales | frescos
let generoActivo = 'todos';      // todos | Hombre | Mujer | Unisex
let busquedaActiva = '';         // texto libre del buscador
```

`_aplicarFiltros()` recorre cada `.card`, evalúa `_matchCat()` + `_matchGenero()` + `_matchBusqueda()` contra sus `data-*`, hace toggle de `display:none`, actualiza el badge de conteo (`#filterCount`) y el `.empty-state`.

- `filtrarCategoria(cat, btn)` — botones de familia olfativa (`.filter-cat`)
- `filtrarGenero(gen, btn)` — botones de género (`.filter-gen`), agregados en el commit `1d1476d`
- `filtrarBusqueda(q)` — input de texto (`#searchInput`, evento `oninput`)

No existe comparador de productos ni modal `#compModal` — esa funcionalidad no está implementada en el código actual.

### Carrito (localStorage)

Array `carrito` persistido en `localStorage['mpCarritoV2']`. Funciones clave: `agregarAlCarrito(card)`, `cambiarCantidad(idx, delta)`, `quitarItem(idx)`, `vaciarCarrito()`, `renderModal()`, `pedirPorWhatsApp()` (arma un mensaje de WhatsApp con el detalle del pedido y el total). El botón "+ Agregar al carrito" de cada card se inyecta dinámicamente por JS en `DOMContentLoaded`, no está hardcodeado en el HTML.

### WhatsApp

Todos los CTAs abren `https://wa.me/50683674466` con mensaje pre-armado. Helpers en el `<script>` inline de `index.html`: `consultarPerfume(nombre)` y `consultarGeneral()`. En cada página de `productos/*.html` el mensaje de WhatsApp está hardcodeado como string literal (nombre y tamaño del producto), no interpolado desde una fuente compartida.

### Quiz de perfil olfativo (`#quiz`)

Es de **un solo paso** (no un flujo de 2 pasos con ocasión+familia): 6 tarjetas de perfil (`.quiz-card`, `data-perfil`) — romántico, seductor, aventurero, sofisticado, "gourmand" (mostrado como "Glamoroso"), moderno. `seleccionarPerfil(perfil, el)` mapea el perfil a una categoría vía `QUIZ_MAP` y reutiliza `_matchCat()` para filtrar hasta 4 cards, renderizadas en `#quizResultGrid`.

### Escena 3D del hero

`#escena-botella` usa Three.js (cargado desde CDN, `three.min.js` r128) para una botella rotable con drag. Es puramente decorativo/visual, no interactúa con el catálogo ni el carrito.

### Páginas de producto (`productos/`)

Las 239 páginas son un **template idéntico letra por letra** entre sí (mismas clases `.pp-*`, mismo `<script>` inline de cantidad/WhatsApp) — solo cambia el dato: `<title>`, meta description, canonical, Open Graph, JSON-LD (`schema.org/Product`), ruta de imagen, breadcrumb (género → marca → nombre), `.pp-brand`, `.pp-title`, `.pp-tags` (género + familia), `.pp-price`/`data-price`, 3 notas en `.pp-pills`, specs (`.pp-dots` de intensidad, duración en texto, familia), y el string del mensaje de WhatsApp. No cargan `script.js` ni el navbar/carrito del sitio principal — tienen su propio topbar simple y su propia lógica de cantidad/total en un `<script>` local.

### CSS design tokens

Tokens clave en `:root` (arriba de `style.css`), compartidos por `index.html` y todas las páginas de producto:
```css
--bg / --bg2 / --bg3 / --bg4   /* fondos oscuros */
--gold / --gold-lt / --gold-dim /* acento dorado */
--cream / --stone               /* texto claro */
--serif   /* Cormorant Garamond */
--sans    /* DM Sans */
```

## Qué se puede cambiar globalmente vs. qué es único por página

**Global (un solo archivo, afecta las 240 páginas a la vez):**
- Paleta de colores, tipografías, spacing → tokens en `style.css`
- Estilos de `.card`, `.filter-*`, `.modal-*`, navbar, footer → `style.css`
- Layout de páginas de producto (`.pp-*`) → `style.css`
- Lógica de carrito, filtros, quiz → `<script>` inline de `index.html` (única fuente de verdad; `script.js` no se usa)

**Único por producto (hay que tocarlo caso por caso, sin fuente central):**
- Nombre, marca, familia olfativa, precio, notas, intensidad/duración
- Ruta de imagen en `img/`
- Metadatos SEO y JSON-LD de cada página en `productos/`
- El string hardcodeado del mensaje de WhatsApp en cada página de producto

## Agregar un producto nuevo

1. Agregar la imagen a `img/`.
2. Copiar un `<div class="card">` existente en `index.html`, actualizar todos los `data-*`, el `src`/`alt` del `<img>`, los `href`, y `.precio`.
3. Copiar una página de `productos/` y actualizar título, meta, JSON-LD, imagen, breadcrumb, tags, precio, notas, specs y el mensaje de WhatsApp.
4. Actualizar el conteo hardcodeado ("239 fragancias" / "230+" en el hero) — no se recalcula solo.

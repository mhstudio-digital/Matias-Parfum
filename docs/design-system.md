# Sistema de diseño v2 — "Boutique de reserva"

Referencia: [Jo Malone London](https://www.jomalone.com). Perfumería inglesa
artesanal, no mall genérico. Fondo claro, aire, tipografía editorial, fotos de
producto sobre blanco, acentos cálidos usados con moderación.

Este documento es la fuente de verdad de los tokens de diseño. Los valores
acá descritos ya están cargados en `:root` de `style.css` (Fase A). Los
componentes (`.navbar`, `.card`, `.pp-*`, etc.) todavía usan la paleta oscura
vieja y se van a migrar en la Fase B — hasta entonces el sitio se va a ver
mezclado/roto, es esperado.

## 1. Paleta de color

### 1.1 Superficies

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#F5F1EA` | Fondo general del sitio (crema/off-white) |
| `--color-bg-alt` | `#FBF9F5` | Fondo de secciones alternas, ligeramente más claro que `--color-bg` |
| `--color-surface` | `#FFFFFF` | Cards, modales, inputs — superficie "elevada" |
| `--color-surface-2` | `#EFE8DA` | Superficie de contraste suave (footer, bloques destacados) |
| `--color-overlay` | `rgba(26,22,15,.55)` | Fondo de modal/drawer sobre el contenido |

### 1.2 Texto

| Token | Hex | Uso |
|---|---|---|
| `--color-text-primary` | `#1C1712` | Titulares, texto de cuerpo principal (negro suave, no `#000`) |
| `--color-text-secondary` | `#6B6255` | Texto secundario, descripciones, metadata |
| `--color-text-muted` | `#A79C8A` | Placeholders, texto deshabilitado, notas terciarias |
| `--color-text-inverse` | `#F5F1EA` | Texto sobre fondos oscuros/acento (botones sólidos) |

### 1.3 Acento

| Token | Hex | Uso |
|---|---|---|
| `--color-accent` | `#B8935A` | Dorado tenue — acento principal: links activos, bordes destacados, iconos |
| `--color-accent-dark` | `#8F6F42` | Hover/active del acento, texto sobre `--color-accent-light` |
| `--color-accent-light` | `#E4D3B4` | Tints de fondo del acento (badges, highlights sutiles) |
| `--color-accent-burgundy` | `#6B2737` | Acento secundario — usar con moderación (ediciones limitadas, detalles de foco, nunca como color base) |

### 1.4 Bordes y funcionales

| Token | Hex | Uso |
|---|---|---|
| `--color-border` | `#E2DACB` | Bordes hairline por defecto (cards, inputs, separadores) |
| `--color-border-strong` | `#C9BEA8` | Bordes con más presencia (focus, hover) |
| `--color-whatsapp` | `#25D366` | Botón de WhatsApp — color funcional, no forma parte de la paleta editorial |
| `--color-error` | `#B23A2E` | Mensajes de error/validación |

**Regla de uso:** el acento dorado (`--color-accent`) se reserva para detalles
— nunca grandes superficies. El contraste principal de la página lo dan
`--color-bg` (crema) contra `--color-text-primary` (negro suave). La
burgundy es un acento *secundario raro*: como máximo un elemento por
viewport.

## 2. Tipografía

### 2.1 Import de Google Fonts

Va en el `<head>` de `index.html` y `templates/producto.ejs`, reemplazando el
`<link>` actual de Cormorant Garamond + DM Sans (eso es trabajo de Fase B,
acá solo se documenta):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 2.2 Por qué estas dos fuentes

- **Playfair Display** (titulares, `--font-serif`) — serif editorial de alto
  contraste, la misma familia que usan revistas de lujo y campañas print de
  perfumería. Reemplaza a Cormorant Garamond: Cormorant es más liviana y
  "invitación de boda", y ya está asociada al look oscuro genérico actual.
  Playfair da más autoridad tipográfica sin perder elegancia — mejor
  soporte de itálicas para nombres de fragancias.
- **Inter** (cuerpo, `--font-sans`) — sans-serif neutra, muy legible en
  tamaños chicos (precios, notas olfativas, descripciones de producto),
  con excelente soporte de pesos intermedios. Reemplaza a DM Sans: Inter es
  el estándar de facto para UI/e-commerce moderno, tiene mejor métrica en
  mayúsculas espaciadas (labels tipo `NOTAS DE SALIDA`) y mejor legibilidad
  a 13–14px que DM Sans.

Fallbacks: `'Playfair Display', 'Times New Roman', serif` y
`'Inter', -apple-system, system-ui, sans-serif`.

### 2.3 Escala tipográfica

Fluida con `clamp()` para que no haya saltos bruscos entre mobile y desktop.

| Token | Valor | Fuente | Uso |
|---|---|---|---|
| `--text-h1` | `clamp(2.75rem, 2.1rem + 3vw, 4.5rem)` | serif, 500 | Hero, título de página de producto |
| `--text-h2` | `clamp(2.1rem, 1.7rem + 2vw, 3rem)` | serif, 500 | Títulos de sección |
| `--text-h3` | `clamp(1.5rem, 1.3rem + 1vw, 2rem)` | serif, 500 | Subtítulos de sección, título de card grande |
| `--text-h4` | `clamp(1.2rem, 1.1rem + .4vw, 1.4rem)` | serif, 600 | Título de card, nombre de producto |
| `--text-h5` | `1.05rem` | sans, 600 | Encabezados de bloque (carrito, filtros) |
| `--text-h6` | `.85rem` | sans, 600, uppercase, tracking `.12em` | Labels de UI (marca en card, categoría) |
| `--text-body` | `.95rem` (15px) / line-height 1.7 | sans, 400 | Cuerpo, descripciones |
| `--text-body-sm` | `.85rem` (13.6px) / line-height 1.6 | sans, 400 | Metadata, notas, precios secundarios |
| `--text-caption` | `.7rem` (11px), uppercase, tracking `.16em` | sans, 500 | Micro-labels (nav, breadcrumb, botones) |

## 3. Espaciado

Escala de 8px con un paso extra en 4px para ajustes finos.

| Token | Valor |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |
| `--space-9` | 96px |
| `--space-10` | 128px |

`--pad` (padding lateral responsive de secciones) y `--max` (ancho máximo de
contenido, 1340px) se mantienen del sistema anterior sin cambios.

## 4. Radios

Jo Malone usa esquinas casi rectas — nada de bordes muy redondeados salvo en
elementos circulares puntuales (avatar, dot indicators).

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 2px | Botones, inputs, cards — default del sitio |
| `--radius-md` | 4px | Imágenes con esquina suavizada, tags |
| `--radius-lg` | 10px | Modales, drawers del carrito |
| `--radius-pill` | 999px | Badges circulares, contador del carrito |

## 5. Sombras

Sombras cálidas (tinte marrón, no gris/azul puro) y muy sutiles — el
elevado en este sistema lo da más el espacio en blanco que la sombra.

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(28,23,15,.06)` | Botones, inputs en hover |
| `--shadow-md` | `0 8px 24px rgba(28,23,15,.08)` | Cards en hover, dropdowns |
| `--shadow-lg` | `0 24px 48px rgba(28,23,15,.12)` | Modal del carrito, quiz overlay |

## 6. Motion y layout (sin cambios)

`--ease`, `--ease2`, `--max` y `--pad` se mantienen idénticos al sistema
anterior — el timing y el ancho de contenido no forman parte del problema
que estamos resolviendo (que es de color/tipografía/densidad), y cambiarlos
ahora sería ruido innecesario para el diff de Fase B.

## 7. Alias legado (transición Fase A → Fase B)

Mientras `templates/*.ejs` y el resto de `style.css` sigan escritos contra
los nombres viejos (`--bg`, `--gold`, `--cream`, `--stone`, `--line`, `--r`,
`--serif`, `--sans`, `--wa`...), esos nombres quedan como **alias** que
apuntan a los tokens semánticos nuevos, así el sitio no se rompe por
variables indefinidas mientras se migra componente por componente en la
Fase B. Estos alias se eliminan al final de la Fase B, cuando ya no quede
ningún `var(--gold)` / `var(--bg)` / etc. en el CSS.

## 8. Qué NO cambia en esta fase

- `templates/card.ejs`, `templates/producto.ejs`, `build.js`, `productos.json`
  — intactos.
- El resto de `style.css` (todo lo que no sea `:root`) — intacto, sigue
  referenciando los tokens viejos vía los alias de la sección 7.
- Ningún HTML generado — no se corrió `node build.js`.

# Guía rápida para desarrollo

El catálogo ya NO se edita a mano en `index.html` ni en `productos/*.html`.
Esos archivos se generan automáticamente desde una única fuente de datos.

## Para editar un producto (precio, nombre, notas, imagen, etc.)

1. Editá `productos.json` (buscá el producto por `slug`).
2. Corré:
   ```
   npm install   # solo la primera vez
   npm run build
   ```
3. Esto regenera `productos/{slug}.html` para los 239 productos y reinyecta
   todas las cards dentro de `index.html` (entre los comentarios
   `<!-- CARDS:START -->` y `<!-- CARDS:END -->`), además de actualizar el
   contador de fragancias en la portada.
4. Revisá `git diff` antes de hacer commit — si el diff toca más de lo que
   esperabas, el problema está en `productos.json` o en las plantillas, no
   edites `index.html`/`productos/*.html` directamente para "arreglarlo".

## Para agregar un producto nuevo

1. Agregá la imagen a `img/`.
2. Agregá un objeto nuevo a `productos.json` (mismo esquema que los demás:
   `slug`, `nombre`, `marca`, `genero`, `familia`, `categoria`, `tamaño`,
   `concentracion`, `precio`, `imagen`, `notas`, `intensidad`, `duracion`,
   `descripcion`).
3. Corré `npm run build`.

## Para agregar un producto que también cambia el diseño

Las plantillas están en `templates/card.ejs` (la tarjeta del catálogo) y
`templates/producto.ejs` (la página individual). Editalas ahí — nunca en los
archivos generados.

## Archivos que ya no se tocan a mano

- `productos/*.html` — generado por `build.js`.
- El bloque de cards dentro de `index.html` — generado por `build.js`.
- `script.js` — se borró: era código muerto (no lo cargaba ninguna página).

## Ver `_conflictos.md`

Cuando se migraron los 239 productos desde el HTML viejo a `productos.json`
(ver `scripts/extract-legacy-data.js`), quedaron documentadas ahí las
inconsistencias que tenía el sitio original (marcas mal cargadas como "Otra"
u "Oud", 2 productos con género distinto entre la card y la página, etc.).
Vale la pena revisarlo y corregir esos datos directamente en `productos.json`.

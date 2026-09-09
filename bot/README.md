# Bot de publicaciones automáticas — Matías Parfum

Publica un perfume nuevo por día en @matias_parfum, usando `productos.json`
como fuente (la misma que usa `build.js` para generar el sitio). Corre
solo, vía GitHub Actions, sin depender de Vercel ni Firebase.

## Cómo funciona

```
GitHub Actions (cron diario, 9am Costa Rica)
  → node bot/daily-post.js
      1. bot/lib/catalog.js   → lee productos.json
      2. bot/lib/tracker.js   → elige el siguiente no publicado (bot/published.json)
      3. bot/lib/ai.js        → genera imagen + caption (hoy: placeholder / futuro: NVIDIA NIM)
      4. bot/lib/metricool.js → publica en Instagram vía API de Metricool
      5. bot/lib/notify.js    → avisa por WhatsApp real (Meta Cloud API)
  → commitea bot/published.json actualizado
```

## Configuración necesaria (una sola vez)

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
Agregar cada uno de estos:

| Secret | De dónde sacarlo |
|---|---|
| `METRICOOL_API_KEY` | app.metricool.com → Configuración → API |
| `METRICOOL_USER_ID` | Mismo lugar que la key |
| `NVIDIA_API_KEY` | build.nvidia.com (gratis) — pendiente por ahora |
| `WHATSAPP_TOKEN` | developers.facebook.com → tu App → WhatsApp → API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Mismo lugar, "Phone number ID" del número de prueba |
| `WHATSAPP_TO_NUMBER` | Tu celular en formato internacional sin "+", ej: `50683674466` |
| `WHATSAPP_TEMPLATE_NAME` | Nombre de la plantilla aprobada (default: `post_publicado`) |

Sin `NVIDIA_API_KEY`, el bot sigue funcionando: usa la foto del catálogo
tal cual y un caption de plantilla en vez de generado por IA.

Sin las variables de `WHATSAPP_*`, el bot publica igual — simplemente no
manda el aviso (queda como warning en el log de Actions).

### Sobre la plantilla de WhatsApp

Como el bot escribe primero (no es una respuesta a un mensaje tuyo),
WhatsApp exige una plantilla pre-aprobada por Meta. Se crea una sola vez en
**Meta Business Manager → WhatsApp Manager → Message templates**, con este
formato (2 variables de texto, categoría "Utility"):

```
✅ Se publicó automáticamente: {{1}} — ₡{{2}}
```

La aprobación de Meta suele tardar de minutos a un par de horas.

## Probarlo sin esperar al cron

Pestaña **Actions** del repo → "Publicación diaria en Instagram" → **Run workflow**.

## Estado actual

- ✅ Lee productos.json real
- ✅ Tracking sin repetir (bot/published.json, versionado en git)
- ✅ Publicación real en Instagram vía Metricool
- ✅ Cron diario gratis (GitHub Actions)
- ✅ Aviso por WhatsApp real (Meta Cloud API, con plantilla)
- ⏳ Imagen/caption con IA real — falta conectar `bot/lib/ai.js` a NVIDIA NIM
  (las 2 llamadas ya están comentadas ahí con la URL y formato exacto)

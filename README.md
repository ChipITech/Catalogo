# Catálogo ChipIT

Catálogo digital de productos con buscador, filtros por categoría y marca (aplican también a los seminuevos), orden por precio o nombre, vista rápida, favoritos y cotización directa por WhatsApp. Sitio 100% estático, listo para GitHub Pages.

## Estructura

```
.
├── index.html            # Estructura de la página
├── css/styles.css        # Diseño, colores (variables en :root) y animaciones
├── js/
│   ├── config.js         # WhatsApp, Mercado Libre, URL del Sheet y reglas (Nuevo / pocas unidades)
│   └── app.js            # Lógica: carga de datos, filtros, tarjetas, vista rápida, favoritos
├── data/
│   ├── products.json     # Copia local de respaldo (se usa si el Sheet no responde)
│   └── products_seed.csv # Mismo contenido en CSV, para importar al Sheet
├── apps-script/Code.gs   # API de solo lectura que expone el Sheet
└── assets/img/           # logo.png, icon.png, favicon.png, og-preview.jpg
```

## Configuración

Todo se cambia en `js/config.js`:

| Opción | Qué hace |
|---|---|
| `SHEET_API_URL` | URL `/exec` de tu Apps Script. Vacía = usa `data/products.json`. |
| `WHATSAPP`, `WHATSAPP_LABEL` | Número con indicativo (sin +) y cómo se muestra en el pie. |
| `MERCADOLIBRE_URL` | Enlace a tu tienda. |
| `NEW_DAYS` | Días que un producto muestra la etiqueta "Nuevo" (15). |
| `LOW_STOCK` | Con esta cantidad o menos aparece "Quedan pocas unidades" (3). |

## Probarlo localmente

El sitio usa `fetch`, así que necesita un servidor local:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000`.

## Base de datos (hoja `Productos` del Google Sheet)

Columnas, en este orden. Ya no existe la columna `icon`.

| # | Columna | Ejemplo | Notas |
|---|---------|---------|-------|
| 1 | `id` | `1` | Único por fila. |
| 2 | `name` | `Cargador UGREEN 65W USB-C GaN` | |
| 3 | `cat` | `Cargadores` | Alimenta los filtros. Escríbela siempre igual. |
| 4 | `brand` | `UGREEN` | |
| 5 | `spec` | `Carga rápida para laptops...` | Descripción corta. Un salto de línea se muestra solo en la vista rápida. |
| 6 | `price` | `150000` | Solo el número. |
| 7 | `stock` | `5` | Interno: el público no lo ve. `0` = agotado; `3` o menos = "Quedan pocas unidades". |
| 8 | `condicion` | `Nuevo` / `Seminuevo` | Define la sección. Vacío cuenta como Nuevo. |
| 9 | `fecha` | `2026-10-13` | Fecha de ingreso. Muestra la etiqueta "Nuevo" durante `NEW_DAYS`. |
| 10 | `image` | link de Drive o ruta | Vacío = ilustración genérica. |

Las filas separadoras (sin `id` o sin `name`) se ignoran, puedes dejarlas para ordenar.

**Para actualizar tu Sheet:** borra la columna `icon`, reordena para que quede como la tabla y agrega `fecha` (formato fecha o `AAAA-MM-DD`).

### Qué ve el público

- El stock real nunca se muestra. Además `Code.gs` lo recorta a un máximo de 4 antes de enviarlo, para que nadie lo lea desde la API.
- Agotado (`0`): tarjeta en gris, sin botón de cotizar, al final de la lista.
- `fecha` reciente: etiqueta "Nuevo".

## Conectar el Google Sheet

1. Crea un Sheet, renombra la primera pestaña a **`Productos`** e importa `data/products_seed.csv` (o pega tus datos con el orden de columnas de arriba).
2. **Extensiones → Apps Script**, pega `apps-script/Code.gs` y guarda.
3. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como **Yo**, acceso **Cualquier usuario**. Copia la URL `/exec`.
4. Pégala en `js/config.js` (`SHEET_API_URL`).

Si ya tenías el script publicado, **actualízalo**: pega el nuevo `Code.gs` y usa Implementar → Administrar implementaciones → Editar → Nueva versión. Sin eso el sitio seguirá leyendo el formato anterior.

El script es solo de lectura (`doGet`): nadie puede escribir en tu catálogo desde internet.

## Fotos de productos

En la columna `image` puedes poner:

- **Link de Google Drive** tal cual lo copias (archivo compartido como "Cualquier usuario con el enlace"). El sitio lo convierte solo. Si el archivo se vuelve privado, la tarjeta vuelve a la ilustración.
- **Ruta del repositorio**, por ejemplo `assets/img/products/1.jpg`. Es la opción más rápida y estable.

Las fotos se muestran completas (sin recortar), centradas sobre un fondo suave. Lo ideal son imágenes cuadradas con el producto centrado.

## Publicar en GitHub Pages

```bash
git add .
git commit -m "Nuevo diseño del catálogo ChipIT"
git push
```

En el repositorio: **Settings → Pages → Branch: main, carpeta / (root)**.

## Diseño

- Paleta (variables en `:root` de `css/styles.css`): azul de marca `#3571B7`, azul marino `#172E48`, azul claro `#B9C6EF`, azul acero `#6B86A9`, casi negro `#272622`, crema `#FCF9E6` y arena `#F4EDE3`.
- Tipografías (Google Fonts): Bagel Fat One para títulos y Figtree para texto.
- Las animaciones respetan `prefers-reduced-motion`.

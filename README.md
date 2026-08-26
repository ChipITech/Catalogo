# Catálogo chipIT

Catálogo digital de productos con buscador, filtros por categoría, orden por
precio/nombre, ficha de detalle y cotización directa por WhatsApp. Sitio
100% estático, listo para publicarse en GitHub Pages.

## Estructura del proyecto

```
.
├── index.html                # Punto de entrada del sitio (estructura HTML)
├── css/
│   └── styles.css            # Estilos (colores, layout, animaciones)
├── js/
│   ├── config.js             # Aquí pegas la URL de tu Google Apps Script
│   └── app.js                # Lógica: buscador, filtros, modal, WhatsApp
├── data/
│   ├── products.json         # Copia local de los productos (respaldo / modo sin Sheets)
│   └── products_seed.csv     # Mismo catálogo en CSV, para importar a Google Sheets
├── assets/
│   └── img/
│       └── logo.jpg          # Logo de chipIT (usado como favicon y en el sitio)
├── apps-script/
│   └── Code.gs                # Script de solo lectura que expone el Sheet como API
└── .gitignore
```

## Tecnologías usadas

| Parte                | Tecnología                                                          |
|-----------------------|---------------------------------------------------------------------|
| Estructura            | HTML5                                                               |
| Estilos               | CSS3 puro (variables, grid, animaciones) — sin frameworks           |
| Interactividad        | JavaScript vanilla (ES6+, `async/await`, `fetch`)                   |
| Datos                 | JSON estático (`data/products.json`) o Google Sheets (opcional)     |
| Backend ligero (opcional) | Google Apps Script — expone un Google Sheet como API de solo lectura |
| Hosting               | GitHub Pages (gratis, estático)                                     |

## Configuración rápida antes de publicar

Abre `js/app.js` y cambia estas dos líneas al inicio del archivo:

```js
const WHATSAPP="573000000000"; // tu número de WhatsApp, con indicativo de país, sin + ni espacios
const MERCADOLIBRE_URL="https://listado.mercadolibre.com.co/_CustId_TU-USUARIO"; // el link real de tu tienda en Mercado Libre
```

El sitio incluye un banner que invita a comprar también desde Mercado Libre
(justo antes de la sección de productos) — solo asegúrate de reemplazar
`MERCADOLIBRE_URL` por el link real de tu tienda o de tus publicaciones.

## Probarlo localmente

Como el sitio carga los productos con `fetch`, no puedes simplemente abrir
`index.html` haciendo doble clic (los navegadores bloquean `fetch` sobre
`file://`). Necesitas un mini servidor local:

```bash
# Con Python (ya instalado en Mac/Linux, o instálalo en Windows)
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en tu navegador.

## Subir a GitHub

Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Primera version del catalogo chipIT"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/chipit-catalogo.git
git push -u origin main
```

## Activar GitHub Pages

1. En tu repositorio en GitHub, ve a **Settings → Pages**.
2. En "Branch", selecciona **main** y carpeta **/ (root)** → **Save**.
3. Espera 1-2 minutos. Tu catálogo estará en:
   `https://tu-usuario.github.io/chipit-catalogo/`

## Conectar el catálogo a Google Sheets

Por defecto el catálogo lee `data/products.json`. Si prefieres administrar
los productos desde una hoja de Google (agregar, editar precios, quitar
productos sin tocar código), sigue estos pasos:

### Paso 1 — Crea la hoja

1. Crea un Google Sheet nuevo.
2. Renombra la primera pestaña a **`Productos`** (exacto).
3. Ve a **Archivo → Importar → Subir**, sube `data/products_seed.csv`.
   Elige **"Reemplazar hoja actual"**.

### Paso 2 — Pega el script

1. En el Sheet, ve a **Extensiones → Apps Script**.
2. Borra el contenido de `Code.gs` y pega el contenido de `apps-script/Code.gs` de este repositorio.
3. Guarda (`Ctrl+S`).

### Paso 3 — Publica como Aplicación web

1. **Implementar → Nueva implementación** → ícono de engranaje → **Aplicación web**.
2. Ejecutar como: **Yo** · Quién tiene acceso: **Cualquier usuario**.
3. **Implementar**, autoriza los permisos, y copia la URL que termina en `/exec`.

### Paso 4 — Conecta el catálogo

Abre `js/config.js` y pega tu URL:
```js
const CONFIG = {
  SHEET_API_URL: "https://script.google.com/macros/s/AKfycb.../exec"
};
```
Guarda, haz commit y push.

**Nota de seguridad:** a diferencia del proyecto de inventario interno, este
`Code.gs` **solo tiene lectura** (`doGet`), sin función para agregar filas
desde la web. Es intencional: este catálogo es público, así que cualquier
edición de productos la haces directamente en el Google Sheet, no desde el
sitio. Así nadie externo puede escribirte productos falsos en tu catálogo.


## Estructura de la base de datos (columnas del Google Sheet)

La hoja **`Productos`** debe tener estas columnas, en este orden (ya vienen
así en `data/products_seed.csv`):

| Columna     | Tipo             | Ejemplo                        | Notas |
|-------------|------------------|----------------------------------|-------|
| `id`        | Número           | `1`                               | Único por fila, no lo repitas. |
| `name`      | Texto            | `Cargador UGREEN 65W USB-C GaN`   | Nombre del producto. |
| `cat`       | Texto            | `Cargadores`                      | Categoría — alimenta el filtro del sitio. |
| `brand`     | Texto            | `UGREEN`                          | Marca. |
| `spec`      | Texto            | `Carga rápida para laptops...`    | Descripción corta. |
| `price`     | Número           | `129900`                          | Sin puntos ni signo $, solo el número. |
| `stock`     | **Número**       | `5`                               | Cantidad disponible. `0` = agotado (ver abajo). |
| `condicion` | Texto            | `Nuevo` o `Seminuevo`             | Decide en qué sección aparece (ver abajo). |
| `icon`      | Emoji            | `🔌`                               | Se usa mientras no haya foto real. |
| `image`     | Texto (URL/ruta) | ruta local o link de Drive        | Foto real (ver sección de fotos más abajo). |

### Columna `stock`: productos agotados

Ahora `stock` es un **número** (antes era el texto "En stock"). El sitio lo
usa así:

- Si `stock` es mayor a 0, la tarjeta muestra "X disponibles" en verde,
  normal.
- Si `stock` es **0**, la tarjeta se muestra automáticamente **en gris**
  (imagen incluida) y el botón "Cotizar" se desactiva, y esa tarjeta **se
  reordena al final** de su listado — nunca desaparece, solo pasa al fondo
  para no competir visualmente con lo que sí está disponible.

Para marcar un producto como agotado, simplemente cambia su celda `stock`
a `0` en el Sheet. En cuanto vuelva a tener unidades, pon el número real y
la tarjeta recupera su color y su posición normal según el orden elegido
(precio, A-Z, etc.).

### Columna `condicion`: sección "Productos Seminuevos"

El sitio ahora tiene **dos secciones**:

- **"Productos destacados"** → todo lo que tenga `condicion = Nuevo` (o la
  celda vacía; vacío también cuenta como Nuevo).
- **"Productos Seminuevos"** → todo lo que tenga `condicion = Seminuevo`.
  Aparece como una sección aparte, más abajo en la página, con su propio
  encabezado y una etiqueta "SEMINUEVO". Si no hay ningún producto marcado
  así, la sección completa se oculta sola — no aparece vacía.

Para mover un producto de una sección a otra, solo cambia el texto de su
celda `condicion` entre `Nuevo` y `Seminuevo`. No necesitas tocar código ni
crear una hoja nueva — todo vive en la misma tabla de `Productos`.

## Cómo manejar las fotos reales de los productos

Cada producto tiene una columna `image`. Si la dejas vacía, se sigue
mostrando el emoji como ícono. Tienes dos formas de poner una foto real, y
**ambas están totalmente soportadas por el sitio ahora mismo**:

### Opción A — guardar las fotos dentro del propio repositorio

1. Consigue fotos que sí puedas usar legalmente: tómalas tú mismo a tu
   inventario real, pide al proveedor/mayorista imágenes autorizadas para
   reventa (muchos las entregan), o compra un paquete de stock con licencia
   comercial.
2. Guárdalas en `assets/img/products/`, por ejemplo `assets/img/products/1.jpg`
   (usando el `id` del producto).
3. En la columna `image` de esa fila, escribe la ruta: `assets/img/products/1.jpg`
4. Sube las imágenes al repo con `git add . && git commit && git push`.

Ventaja: cargan rápido, nunca se rompen, sin límites de cuota. Ideal si tú
mismo subes los cambios a GitHub.

### Opción B — una carpeta de Google Drive (recomendada para tu caso)

Ya dejé el sitio preparado para que **pegues el link normal de Drive tal
cual, sin convertirlo a mano** — el catálogo lo transforma automáticamente
al formato que sí se puede mostrar como imagen.

Pasos:

1. Sube la foto del producto a una carpeta de Google Drive.
2. Clic derecho sobre el archivo → **Compartir → Acceso general** → cambia a
   **"Cualquier usuario con el enlace"** (rol: Lector). Esto es obligatorio:
   si el archivo queda privado, la imagen no se va a poder mostrar en el
   sitio público.
3. Clic en **Copiar enlace**. Te va a dar algo como:
   `https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing`
4. Pega ese link **tal cual, sin editarlo**, en la columna `image` de la fila
   de ese producto en el Sheet.
5. Listo — el sitio detecta que es un link de Drive y lo convierte solo al
   cargar la página. No necesitas hacer nada más.

El conversor (en `js/app.js`, función `driveImageUrl`) reconoce los formatos
más comunes que da Drive (`/file/d/ID/view`, `open?id=ID`, `uc?id=ID`, o
incluso si alguien pega solo el ID del archivo).

**Limitaciones a tener presentes con Drive:**
- Debes dejar el archivo como "Cualquier usuario con el enlace"; si luego
  alguien cambia el permiso a privado, la imagen desaparece del catálogo
  (se cae automáticamente al emoji, no rompe el diseño).
- Con mucho tráfico simultáneo, Google puede limitar temporalmente las
  descargas de un archivo muy solicitado — algo a considerar si el catálogo
  crece mucho. Para un catálogo de este tamaño no debería ser un problema.
- Carga un poco más lento que si la imagen estuviera en el propio repo.

Si en algún momento el equipo empieza a subir cambios a GitHub directamente,
la Opción A es la más robusta a largo plazo — pero para empezar ya, Drive
funciona bien y es más cómodo para quien solo maneja el Sheet y una carpeta
compartida.


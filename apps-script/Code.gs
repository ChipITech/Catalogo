/**
 * API de catálogo — ChipIT
 * ---------------------------------------------------
 * Convierte la hoja "Productos" de Google Sheets en una API de SOLO LECTURA
 * para el catálogo público. No tiene doPost: nadie puede escribir en tu Sheet
 * desde internet. Para editar el catálogo, edita el Sheet directamente.
 *
 * Columnas, en este orden:
 *   id | name | cat | brand | spec | price | stock | condicion | fecha | image
 *
 * Reglas:
 *  - Las filas separadoras o vacías (sin id o sin name) se ignoran.
 *  - stock real nunca sale de aquí: se devuelve como máximo 4, así el público
 *    no puede conocer tu inventario. El sitio solo usa 0 (agotado) y 3 o menos
 *    (quedan pocas unidades).
 *  - fecha se entrega como texto AAAA-MM-DD (fecha de ingreso, para la etiqueta "Nuevo").
 *
 * INSTALACIÓN (detalle en README.md):
 * 1. Extensiones > Apps Script, pega este archivo en Code.gs.
 * 2. Implementar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Yo   - Quién tiene acceso: Cualquier usuario
 * 3. Copia la URL (/exec) en js/config.js.
 * Si cambias este código, vuelve a implementar: Implementar > Administrar
 * implementaciones > Editar > Nueva versión.
 */

const SHEET_NAME = 'Productos';
const STOCK_CAP = 4;

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('No existe una hoja llamada "' + SHEET_NAME + '"');
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function cell_(header, value) {
  if (value === '' || value === null) return null;
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  if (header === 'stock') {
    const n = Number(value);
    return isNaN(n) ? null : Math.min(Math.max(n, 0), STOCK_CAP);
  }
  return typeof value === 'string' ? value.trim() : value;
}

/** GET → arreglo JSON con los productos de la hoja. */
function doGet() {
  const values = getSheet_().getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const rows = values.slice(1)
    .filter(row => row[headers.indexOf('id')] !== '' && row[headers.indexOf('name')] !== '')
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = cell_(h, row[i]); });
      return obj;
    });
  return jsonResponse_(rows);
}

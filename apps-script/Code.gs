/**
 * API de catálogo — chipIT
 * ---------------------------------------------------
 * Convierte una hoja de Google Sheets en una mini API de SOLO LECTURA
 * para que el catálogo público consulte los productos.
 *
 * A diferencia del proyecto de inventario interno, este script NO tiene
 * doPost (no permite agregar filas). Es intencional: este catálogo es
 * público en internet, y si cualquier visitante pudiera escribir en tu
 * Sheet, alguien podría llenarlo de productos falsos. Para editar el
 * catálogo, simplemente edita el Google Sheet directamente — los cambios
 * se reflejan solos la próxima vez que alguien abra la página.
 *
 * INSTALACIÓN (detalle completo en README.md):
 * 1. Crea un Google Sheet, llama a la primera hoja "Productos".
 * 2. Importa data/products_seed.csv en esa hoja.
 * 3. Extensiones > Apps Script, borra el contenido de Code.gs y pega este archivo.
 * 4. Implementar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 * 5. Copia la URL y pégala en js/config.js
 */

const SHEET_NAME = 'Productos';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('No existe una hoja llamada "' + SHEET_NAME + '"');
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET → devuelve todos los productos de la hoja como un arreglo de objetos JSON.
 */
function doGet(e) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let v = row[i];
        obj[h] = (v === '' || v === null) ? null : v;
      });
      return obj;
    });
  return jsonResponse_(rows);
}

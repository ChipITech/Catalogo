/**
 * Configuración del catálogo ChipIT.
 * Es el único archivo que necesitas tocar para cambiar datos de contacto o reglas.
 */
const CONFIG = {
  // URL de tu Google Apps Script (termina en /exec). Si la dejas vacía ("")
  // el catálogo usa el archivo local data/products.json.
  SHEET_API_URL: "https://script.google.com/macros/s/AKfycbyLBtsq42Ngf0zab0lqSiZq14NrWd-3L4VJtcVZYHGIoxa9KI2NyaG2BmoUZ6-1VP01Rw/exec",

  // WhatsApp con indicativo de país, sin + ni espacios.
  WHATSAPP: "573176274048",
  WHATSAPP_LABEL: "+57 317 627 4048",

  // Tu tienda en Mercado Libre.
  MERCADOLIBRE_URL: "https://listado.mercadolibre.com.co/_CustId_588678241",

  // Un producto muestra la etiqueta "Nuevo" durante estos días desde su fecha de ingreso.
  NEW_DAYS: 15,

  // Con esta cantidad o menos se muestra "Quedan pocas unidades".
  LOW_STOCK: 3
};

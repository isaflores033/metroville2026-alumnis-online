/**
 * =======================================================================
 * METROVILLE 2026 - REGISTRO DE ALUMNIS Y ESTUDIANTES ONLINE (HALLOWEEN)
 * Google Apps Script - Endpoint con Validación de Cédula Única
 * =======================================================================
 */

var LIMITE_MAXIMO_REGISTROS = 73;

/**
 * Inicializa la hoja con encabezados si está vacía.
 */
function inicializarHojaSiEsNecesario(sheet) {
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      'Fecha y Hora',
      'Nombre y Apellido',
      'Cédula',
      'Correo Electrónico',
      'Celular',
      'Tipo de Asistente',
      'Dispositivo'
    ];
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight('bold');
    range.setBackground('#1a1a24');
    range.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
    Logger.log('Encabezados creados exitosamente.');
  }
}

/**
 * Cuenta la cantidad real de registros existentes (excluyendo fila 1).
 */
function obtenerTotalRegistros(sheet) {
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  return lastRow - 1;
}

/**
 * Obtiene la lista de todas las cédulas ya registradas en la hoja.
 */
function obtenerCedulasRegistradas(sheet) {
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }
  var total = obtenerTotalRegistros(sheet);
  if (total <= 0) return [];
  var values = sheet.getRange(2, 3, total, 1).getValues();
  var cedulas = [];
  for (var i = 0; i < values.length; i++) {
    var c = values[i][0].toString().replace(/^'/, '').trim();
    if (c) cedulas.push(c);
  }
  return cedulas;
}

/**
 * Procesa el registro con control estricto de cédula única y límite de cupos.
 */
function procesarRegistro(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    inicializarHojaSiEsNecesario(sheet);

    var totalActual = obtenerTotalRegistros(sheet);

    // 1. Validar límite máximo de cupos
    if (totalActual >= LIMITE_MAXIMO_REGISTROS) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        code: 'LIMIT_REACHED',
        message: 'Lo sentimos, se ha alcanzado el límite de 73 cupos.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var nombre = (data.nombre || '').toString().trim();
    var cedula = (data.cedula || '').toString().trim();
    var email = (data.email || '').toString().trim();
    var celular = (data.celular || '').toString().trim();
    var tipo = (data.tipo || 'No especificado').toString().trim();
    var userAgent = (data.userAgent || '').toString().substring(0, 150);

    if (!nombre || !cedula || !email) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Faltan campos obligatorios.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Control estricto de duplicados por CÉDULA
    if (totalActual > 0) {
      var cedulasExistentes = obtenerCedulasRegistradas(sheet);
      if (cedulasExistentes.indexOf(cedula) !== -1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          code: 'DUPLICATE_CEDULA',
          message: 'Esta cédula ya se encuentra registrada en la lista de asistentes.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. Registrar fila
    var fechaRegistro = Utilities.formatDate(new Date(), "America/Guayaquil", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      fechaRegistro,
      nombre,
      "'" + cedula,
      email,
      celular ? "'" + celular : 'No proporcionado',
      tipo,
      userAgent
    ]);
    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '¡Registro guardado exitosamente!'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET: Devuelve estado de cupos y lista de cédulas registradas para validación en tiempo real.
 */
function doGet(e) {
  if (e && e.parameter && (e.parameter.nombre || e.parameter.cedula)) {
    return procesarRegistro(e.parameter);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    inicializarHojaSiEsNecesario(sheet);

    var total = obtenerTotalRegistros(sheet);
    var cedulas = obtenerCedulasRegistradas(sheet);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      totalRegistros: total,
      limiteMaximo: LIMITE_MAXIMO_REGISTROS,
      cuposDisponibles: Math.max(0, LIMITE_MAXIMO_REGISTROS - total),
      agotado: total >= LIMITE_MAXIMO_REGISTROS,
      cedulasRegistradas: cedulas
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST: Procesa el registro con JSON o Form Data.
 */
function doPost(e) {
  var data = {};
  if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      data = e.parameter || {};
    }
  } else if (e && e.parameter) {
    data = e.parameter;
  }
  return procesarRegistro(data);
}

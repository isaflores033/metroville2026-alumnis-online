/**
 * =======================================================================
 * METROVILLE 2026 - REGISTRO DE ALUMNIS Y ESTUDIANTES ONLINE (HALLOWEEN)
 * Google Apps Script - Endpoint Ultra-Robusto para Google Sheets
 * =======================================================================
 */

var LIMITE_MAXIMO_REGISTROS = 73;

/**
 * Inicializa la hoja de cálculo con encabezados si está vacía.
 */
function inicializarHojaSiEsNecesario(sheet) {
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
  }
}

/**
 * Cuenta la cantidad real de registros existentes (excluyendo fila 1).
 */
function obtenerTotalRegistros(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  return lastRow - 1;
}

/**
 * Función central de procesamiento de registros:
 * Funciona tanto desde GET como desde POST.
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
        message: 'Lo sentimos, se ha alcanzado el límite de 73 cupos.',
        totalRegistros: totalActual,
        limiteMaximo: LIMITE_MAXIMO_REGISTROS,
        cuposDisponibles: 0
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Extraer campos
    var nombre = (data.nombre || '').toString().trim();
    var cedula = (data.cedula || '').toString().trim();
    var email = (data.email || '').toString().trim();
    var celular = (data.celular || '').toString().trim();
    var tipo = (data.tipo || 'No especificado').toString().trim();
    var userAgent = (data.userAgent || '').toString().substring(0, 150);

    if (!nombre || !cedula || !email) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        code: 'MISSING_FIELDS',
        message: 'Faltan campos requeridos.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Validar duplicados por cédula
    if (totalActual > 0) {
      var cedulasExistentes = sheet.getRange(2, 3, totalActual, 1).getValues();
      for (var i = 0; i < cedulasExistentes.length; i++) {
        var cedulaFila = cedulasExistentes[i][0].toString().replace(/^'/, '').trim();
        if (cedulaFila === cedula) {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            code: 'DUPLICATE_CEDULA',
            message: 'La cédula ' + cedula + ' ya se encuentra registrada.'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // 4. Fecha de Ecuador
    var fechaRegistro = Utilities.formatDate(new Date(), "America/Guayaquil", "yyyy-MM-dd HH:mm:ss");

    // Guardar fila
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

    var nuevoTotal = totalActual + 1;
    var cuposRestantes = Math.max(0, LIMITE_MAXIMO_REGISTROS - nuevoTotal);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '¡Registro completado exitosamente!',
      totalRegistros: nuevoTotal,
      limiteMaximo: LIMITE_MAXIMO_REGISTROS,
      cuposDisponibles: cuposRestantes
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Error al registrar: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET: Soporta tanto consulta de cupos como registro directo.
 */
function doGet(e) {
  // Si trae datos de registro en URL, procesarlo directamente
  if (e && e.parameter && (e.parameter.nombre || e.parameter.cedula)) {
    return procesarRegistro(e.parameter);
  }

  // De lo contrario, devolver estado de cupos
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    inicializarHojaSiEsNecesario(sheet);

    var total = obtenerTotalRegistros(sheet);
    var disponibles = Math.max(0, LIMITE_MAXIMO_REGISTROS - total);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      totalRegistros: total,
      limiteMaximo: LIMITE_MAXIMO_REGISTROS,
      cuposDisponibles: disponibles,
      agotado: total >= LIMITE_MAXIMO_REGISTROS
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
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

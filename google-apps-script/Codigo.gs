/**
 * =======================================================================
 * METROVILLE 2026 - REGISTRO DE ALUMNIS Y ESTUDIANTES ONLINE (HALLOWEEN)
 * Google Apps Script - Endpoint para Google Sheets
 * =======================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. En tu hoja de cálculo de Google Sheets, ve a: Extensiones > Apps Script.
 * 2. Borra todo el código que esté allí y pega este archivo completo.
 * 3. Haz clic en el ícono de Guardar (disco).
 * 4. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 5. Selecciona tipo: "Aplicación web".
 * 6. Configura:
 *    - Descripción: "Metroville 2026 API"
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE: Debe ser "Cualquiera" o "Anyone").
 * 7. Haz clic en "Implementar", autoriza los permisos requeridos.
 * 8. Copia la URL de la aplicación web generada (termina en /exec) y pégala en js/config.js.
 */

// Límite máximo de registros permitidos
var LIMITE_MAXIMO_REGISTROS = 73;

/**
 * Inicializa la hoja de cálculo con los encabezados correspondientes si está vacía.
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
      'IP / Dispositivo'
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
 * Cuenta la cantidad real de registros existentes (excluyendo la fila de encabezados).
 * NOTA PARA EL USUARIO:
 * Si borras una fila de prueba en Google Sheets, sheet.getLastRow() se actualiza
 * automáticamente y ese cupo se RESTA del total, liberando espacio para nuevos registros.
 */
function obtenerTotalRegistros(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  return lastRow - 1;
}

/**
 * GET: Devuelve el estado actual de cupos (usado por la web para mostrar disponibles).
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    inicializarHojaSiEsNecesario(sheet);

    var total = obtenerTotalRegistros(sheet);
    var disponibles = Math.max(0, LIMITE_MAXIMO_REGISTROS - total);

    var respuesta = {
      status: 'success',
      totalRegistros: total,
      limiteMaximo: LIMITE_MAXIMO_REGISTROS,
      cuposDisponibles: disponibles,
      agotado: total >= LIMITE_MAXIMO_REGISTROS
    };

    return ContentService
      .createTextOutput(JSON.stringify(respuesta))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Error al consultar estado: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST: Procesa el registro de un nuevo asistente.
 */
function doPost(e) {
  // Usamos ScriptLock para prevenir condiciones de carrera si dos usuarios envían al mismo milisegundo
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Esperar hasta 10 segundos
  } catch (lockError) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        code: 'SERVER_BUSY',
        message: 'El servidor está procesando solicitudes simultáneas. Por favor intenta en unos segundos.'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    inicializarHojaSiEsNecesario(sheet);

    // Obtener los datos (soporta tanto JSON como URLSearchParams / FormData)
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    var totalActual = obtenerTotalRegistros(sheet);

    // 1. Validar límite máximo de registros (73)
    if (totalActual >= LIMITE_MAXIMO_REGISTROS) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          code: 'LIMIT_REACHED',
          message: 'Lo sentimos, se ha alcanzado el límite máximo de cupos (' + LIMITE_MAXIMO_REGISTROS + ') para Metroville 2026.',
          totalRegistros: totalActual,
          limiteMaximo: LIMITE_MAXIMO_REGISTROS,
          cuposDisponibles: 0
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Extraer y sanitizar campos
    var nombre = (data.nombre || '').toString().trim();
    var cedula = (data.cedula || '').toString().trim();
    var email = (data.email || '').toString().trim();
    var celular = (data.celular || '').toString().trim();
    var tipo = (data.tipo || 'No especificado').toString().trim();
    var userAgent = (data.userAgent || '').toString().substring(0, 150);

    // Validaciones básicas de integridad
    if (!nombre || !cedula || !email) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          code: 'MISSING_FIELDS',
          message: 'Faltan campos obligatorios (Nombre, Cédula o Correo).'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Validar si la cédula ya fue registrada previamente para evitar duplicados
    if (totalActual > 0) {
      var cedulasExistentes = sheet.getRange(2, 3, totalActual, 1).getValues();
      for (var i = 0; i < cedulasExistentes.length; i++) {
        var cedulaFila = cedulasExistentes[i][0].toString().replace(/^'/, '').trim();
        if (cedulaFila === cedula) {
          return ContentService
            .createTextOutput(JSON.stringify({
              status: 'error',
              code: 'DUPLICATE_CEDULA',
              message: 'La cédula ' + cedula + ' ya se encuentra registrada en la lista de asistentes.'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // 4. Formatear fecha y hora en huso horario de Ecuador
    var fechaRegistro = Utilities.formatDate(new Date(), "America/Guayaquil", "yyyy-MM-dd HH:mm:ss");

    // Guardar fila (anteponiendo apóstrofe a cédula y celular para conservar ceros a la izquierda)
    sheet.appendRow([
      fechaRegistro,
      nombre,
      "'" + cedula,
      email,
      celular ? "'" + celular : 'No proporcionado',
      tipo,
      userAgent
    ]);

    var nuevoTotal = totalActual + 1;
    var cuposRestantes = Math.max(0, LIMITE_MAXIMO_REGISTROS - nuevoTotal);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: '¡Registro completado exitosamente! Nos vemos en Metroville 2026.',
        totalRegistros: nuevoTotal,
        limiteMaximo: LIMITE_MAXIMO_REGISTROS,
        cuposDisponibles: cuposRestantes
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Ocurrió un error inesperado al registrar: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

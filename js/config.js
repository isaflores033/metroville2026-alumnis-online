/**
 * Configuración general de Metroville 2026
 */
const CONFIG = {
  // URL de la aplicación web de Google Apps Script vinculada a Google Sheets
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzDLSxqaCmwf8OaGwPxy3ibBI1ce45H0SYrO_68bsl4AWw06BW5O3WckHId8qwsw0pLpA/exec",

  // Registros abiertos sin límite de cupos
  SIN_LIMITE_CUPOS: true,
  MAX_REGISTRACIONES: null,

  // Nombre del evento
  EVENTO_NOMBRE: "Metroville 2026",
  SUBTITULO: "Edición Halloween - Alumni & Estudiantes Online",

  // Modo de desarrollo/pruebas locales (si APPS_SCRIPT_URL está vacía)
  DEV_FALLBACK_TO_LOCALSTORAGE: false
};

window.CONFIG = CONFIG;

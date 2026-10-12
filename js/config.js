/**
 * Configuración general de Metroville 2026
 */
const CONFIG = {
  // Pega aquí la URL de tu aplicación web de Google Apps Script (termina en /exec):
  // Ejemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
  APPS_SCRIPT_URL: "",

  // Límite máximo de registros para el evento
  MAX_REGISTRACIONES: 73,

  // Nombre del evento
  EVENTO_NOMBRE: "Metroville 2026",
  SUBTITULO: "Edición Halloween - Alumni & Estudiantes Online",

  // Modo de desarrollo/pruebas locales (si APPS_SCRIPT_URL está vacía, guarda en localStorage como simulación)
  DEV_FALLBACK_TO_LOCALSTORAGE: true
};

window.CONFIG = CONFIG;

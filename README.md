# Metroville 2026 - Registro de Alumnis y Estudiantes Online 🎃

Página web full width (100%) y 100vh con efecto **Dark Glassmorphism** para el registro exclusivo de la fiesta de Halloween **Metroville 2026**, organizada para la comunidad de Alumnis y Estudiantes de la modalidad Online de **La Metro**.

---

## 🎨 Características del Diseño

- **Fondo Completo (100% y 100vh):** Utiliza la imagen oficial de ambientación de Metroville (`FondoMetroVille-2026.jpeg`).
- **Disposición Glassmorphism:**
  - **Panel Izquierdo:** Formulario de registro con estética *frosted glass* oscura, alta legibilidad, validación visual en tiempo real y selector exclusivo de roles.
  - **Panel Derecho:** Vidrio translúcido que preserva la vista atmosférica del fondo, con el logo sutil de La Metro enlazado a [www.lametro.edu.ec](https://www.lametro.edu.ec).
- **Control de Cupos:** Límite máximo establecido en **73 registros**.
  - Si borras una fila de prueba en Google Sheets, el conteo total disminuye automáticamente (`sheet.getLastRow() - 1`), restaurando el cupo de inmediato.

---

## 📋 Validación de Datos

1. **Nombre y Apellido:** Obligatorio, mínimo 2 palabras.
2. **Cédula de Identidad (Ecuador):** Obligatorio, exactamente 10 dígitos numéricos validados con el algoritmo oficial **Módulo 10**.
3. **Correo Electrónico:** Obligatorio con formato válido.
4. **Celular:** Opcional.
5. **Categoría (Soy Alumni / Soy estudiante del online):**
   - Selección mutuamente excluyente (solo una activa a la vez).
   - Puede deseleccionarse haciendo clic nuevamente.
   - Si no se selecciona ninguna, se permite el envío con la nota de advertencia correspondiente.

---

## ⚙️ Conexión con Google Sheets (Google Apps Script)

El código del backend se encuentra listo en [`google-apps-script/Codigo.gs`](file:///Users/Proyectos%20Google%20IA/metroville2026-registros/google-apps-script/Codigo.gs).

### Pasos para Activar tu Google Sheets:

1. Abre tu hoja de cálculo en **Google Sheets**.
2. Ve al menú superior: **Extensiones** > **Apps Script**.
3. Borra el código existente y pega todo el contenido de [`google-apps-script/Codigo.gs`](file:///Users/Proyectos%20Google%20IA/metroville2026-registros/google-apps-script/Codigo.gs).
4. Haz clic en el ícono de **Guardar** (💾).
5. Haz clic en el botón azul **Implementar** (arriba a la derecha) > **Nueva implementación**.
6. En el engranaje de configuración, selecciona tipo: **Aplicación web**.
7. Configura los siguientes campos:
   - **Descripción:** `Metroville 2026 Registros`
   - **Ejecutar como:** `Yo (tu cuenta de Google)`
   - **Quién tiene acceso:** `Cualquiera` *(Muy importante: debe ser "Cualquiera" para que el formulario web pueda enviar los datos).*
8. Haz clic en **Implementar** y concede los permisos de tu cuenta de Google.
9. Copia la **URL de la aplicación web** generada (termina en `/exec`).
10. Abre el archivo [`js/config.js`](file:///Users/Proyectos%20Google%20IA/metroville2026-registros/js/config.js) en este proyecto y pega la URL en:
    ```javascript
    APPS_SCRIPT_URL: "TU_URL_DE_APPS_SCRIPT_AQUI"
    ```

> 💡 **Nota sobre las pruebas:** Si la variable `APPS_SCRIPT_URL` está vacía, el sistema funciona en modo de prueba local con `localStorage` para que puedas probar el flujo completo sin errores.

---

## 🚀 Subir a GitHub y Vercel

### 1. Inicializar y subir a GitHub:
```bash
git init
git add .
git commit -m "feat: implementacion de pagina de registro metroville 2026"
git branch -M main
git remote add origin https://github.com/isaflores033/metroville2026-alumnis-online.git
git push -u origin main
```

### 2. Despliegue en Vercel:
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu GitHub.
2. Haz clic en **Add New** > **Project**.
3. Importa el repositorio `metroville2026-alumnis-online`.
4. Deja la configuración por defecto (Framework Preset: Other) y haz clic en **Deploy**.
5. ¡Listo! Tendrás tu enlace público con SSL en cuestión de segundos.

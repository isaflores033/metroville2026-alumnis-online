/**
 * Metroville 2026 - Lógica de Aplicación
 * Manejo de Formulario, Validaciones en Tiempo Real, Cuotas e Integración
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const form = document.getElementById('registrationForm');
  const nombreInput = document.getElementById('nombreInput');
  const cedulaInput = document.getElementById('cedulaInput');
  const emailInput = document.getElementById('emailInput');
  const celularInput = document.getElementById('celularInput');
  const submitBtn = document.getElementById('submitBtn');

  // Feedbacks
  const nombreFeedback = document.getElementById('nombreFeedback');
  const cedulaFeedback = document.getElementById('cedulaFeedback');
  const emailFeedback = document.getElementById('emailFeedback');
  const celularFeedback = document.getElementById('celularFeedback');

  // Casillas de rol (Soy Alumni / Soy estudiante del online)
  const cardAlumni = document.getElementById('cardAlumni');
  const cardOnline = document.getElementById('cardOnline');

  // Elementos de cuota
  const quotaBanner = document.getElementById('quotaBanner');
  const quotaText = document.getElementById('quotaText');
  const quotaPill = document.getElementById('quotaPill');

  // Modal
  const successModal = document.getElementById('successModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const summaryNombre = document.getElementById('summaryNombre');
  const summaryCedula = document.getElementById('summaryCedula');
  const summaryEmail = document.getElementById('summaryEmail');
  const summaryTipo = document.getElementById('summaryTipo');

  // Toast
  const toastContainer = document.getElementById('toastContainer');

  // Estado local
  let selectedRole = null; // null | 'Soy Alumni' | 'Soy estudiante del online'
  let cuposDisponibles = window.CONFIG.MAX_REGISTRACIONES || 73;
  let totalRegistrados = 0;
  let estaAgotado = false;

  // =========================================================================
  // 1. GESTIÓN DE ROLES (MUTUAMENTE EXCLUYENTES O NINGUNO)
  // =========================================================================

  function actualizarSeleccionRol(nuevoRol, tarjetaElemento) {
    if (selectedRole === nuevoRol) {
      // Si hace clic en la que ya está seleccionada, se deselecciona (ninguna opción activa)
      selectedRole = null;
      tarjetaElemento.classList.remove('is-selected');
      tarjetaElemento.setAttribute('aria-checked', 'false');
    } else {
      // Deseleccionar todas primero
      [cardAlumni, cardOnline].forEach(card => {
        card.classList.remove('is-selected');
        card.setAttribute('aria-checked', 'false');
      });

      // Seleccionar la elegida
      selectedRole = nuevoRol;
      tarjetaElemento.classList.add('is-selected');
      tarjetaElemento.setAttribute('aria-checked', 'true');
    }
  }

  cardAlumni.addEventListener('click', () => {
    actualizarSeleccionRol('Soy Alumni', cardAlumni);
  });

  cardOnline.addEventListener('click', () => {
    actualizarSeleccionRol('Soy estudiante del online', cardOnline);
  });

  // Accesibilidad con teclado (Enter o Espacio)
  [cardAlumni, cardOnline].forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // =========================================================================
  // 2. VALIDACIONES EN TIEMPO REAL
  // =========================================================================

  // Helper para pintar estado visual de los inputs
  function setFieldState(input, feedbackEl, isValid, message) {
    if (isValid === true) {
      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
      feedbackEl.textContent = message || '';
      feedbackEl.className = 'feedback-msg success';
    } else if (isValid === false) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      feedbackEl.textContent = message || '';
      feedbackEl.className = 'feedback-msg error';
    } else {
      input.classList.remove('is-valid', 'is-invalid');
      feedbackEl.textContent = message || '';
      feedbackEl.className = 'feedback-msg';
    }
  }

  // Nombre y Apellido (Mínimo 2 palabras)
  nombreInput.addEventListener('input', () => {
    const val = nombreInput.value;
    if (val.trim() === '') {
      setFieldState(nombreInput, nombreFeedback, null, 'Ingresa tu nombre y apellido completo (mínimo 2 palabras).');
      return;
    }
    const res = Validator.validarNombre(val);
    setFieldState(nombreInput, nombreFeedback, res.esValido, res.mensaje);
  });

  // Cédula de Ecuador (Módulo 10, solo números, 10 dígitos)
  cedulaInput.addEventListener('input', (e) => {
    // Permitir solo números
    cedulaInput.value = cedulaInput.value.replace(/\D/g, '').slice(0, 10);
    const val = cedulaInput.value;

    if (val.length === 0) {
      setFieldState(cedulaInput, cedulaFeedback, null, '10 dígitos (Validación oficial módulo 10).');
      return;
    }

    if (val.length < 10) {
      setFieldState(cedulaInput, cedulaFeedback, false, `Faltan dígitos: ${val.length}/10`);
      return;
    }

    const res = Validator.validarCedulaEcuador(val);
    setFieldState(cedulaInput, cedulaFeedback, res.esValido, res.mensaje);
  });

  // Correo electrónico
  emailInput.addEventListener('input', () => {
    const val = emailInput.value;
    if (val.trim() === '') {
      setFieldState(emailInput, emailFeedback, null, 'Te enviaremos la confirmación a esta dirección.');
      return;
    }
    const res = Validator.validarEmail(val);
    setFieldState(emailInput, emailFeedback, res.esValido, res.mensaje);
  });

  // Celular (opcional)
  celularInput.addEventListener('input', () => {
    // Permitir números y espacios básicos
    celularInput.value = celularInput.value.replace(/[^\d\s\-+()]/g, '');
    const val = celularInput.value;
    if (val.trim() === '') {
      setFieldState(celularInput, celularFeedback, null, 'Para avisos importantes del evento vía WhatsApp.');
      return;
    }
    const res = Validator.validarCelular(val);
    setFieldState(celularInput, celularFeedback, res.esValido, res.mensaje);
  });

  // =========================================================================
  // 3. CONSULTA DE CUPOS DISPONIBLES (MÁXIMO 73)
  // =========================================================================

  function actualizarUIcupos(total, max, disponibles) {
    totalRegistrados = total;
    cuposDisponibles = disponibles;
    estaAgotado = disponibles <= 0;

    quotaPill.textContent = `${disponibles} Cupos libres`;

    if (estaAgotado) {
      quotaText.textContent = '¡Cupos Agotados para Metroville!';
      quotaBanner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Cupos Agotados';
    } else if (disponibles <= 10) {
      quotaText.textContent = `¡Últimos ${disponibles} cupos disponibles!`;
      quotaBanner.style.borderColor = 'rgba(245, 158, 11, 0.5)';
    } else {
      quotaText.textContent = `${disponibles} de ${max} cupos disponibles`;
    }
  }

  async function consultarCupos() {
    const url = window.CONFIG.APPS_SCRIPT_URL;

    // Si aún no se ha configurado la URL de Apps Script, consultamos almacenamiento local para pruebas
    if (!url || url.trim() === '') {
      const registrosLocales = JSON.parse(localStorage.getItem('metroville_test_registros') || '[]');
      const total = registrosLocales.length;
      const max = window.CONFIG.MAX_REGISTRACIONES || 73;
      const libres = Math.max(0, max - total);
      actualizarUIcupos(total, max, libres);
      return;
    }

    try {
      const response = await fetch(`${url}?action=getQuota`, {
        method: 'GET',
        mode: 'cors'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          actualizarUIcupos(
            data.totalRegistros || 0,
            data.limiteMaximo || window.CONFIG.MAX_REGISTRACIONES,
            data.cuposDisponibles !== undefined ? data.cuposDisponibles : (window.CONFIG.MAX_REGISTRACIONES - data.totalRegistros)
          );
        }
      }
    } catch (err) {
      console.warn('No se pudo sincronizar cupos en tiempo real:', err);
      // Fallback a valor por defecto
      actualizarUIcupos(0, window.CONFIG.MAX_REGISTRACIONES, window.CONFIG.MAX_REGISTRACIONES);
    }
  }

  // =========================================================================
  // 4. ENVÍO DEL FORMULARIO Y REGISTRO EN GOOGLE SHEETS
  // =========================================================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (estaAgotado) {
      mostrarToast('Lo sentimos, se han agotado todos los cupos disponibles.', 'error');
      return;
    }

    // Validar Nombre
    const vNombre = Validator.validarNombre(nombreInput.value);
    setFieldState(nombreInput, nombreFeedback, vNombre.esValido, vNombre.mensaje);
    if (!vNombre.esValido) {
      nombreInput.focus();
      return;
    }

    // Validar Cédula
    const vCedula = Validator.validarCedulaEcuador(cedulaInput.value);
    setFieldState(cedulaInput, cedulaFeedback, vCedula.esValido, vCedula.mensaje);
    if (!vCedula.esValido) {
      cedulaInput.focus();
      return;
    }

    // Validar Correo
    const vEmail = Validator.validarEmail(emailInput.value);
    setFieldState(emailInput, emailFeedback, vEmail.esValido, vEmail.mensaje);
    if (!vEmail.esValido) {
      emailInput.focus();
      return;
    }

    // Validar Celular (si tiene contenido)
    if (celularInput.value.trim() !== '') {
      const vCel = Validator.validarCelular(celularInput.value);
      setFieldState(celularInput, celularFeedback, vCel.esValido, vCel.mensaje);
      if (!vCel.esValido) {
        celularInput.focus();
        return;
      }
    }

    // Preparar datos para enviar
    const payload = {
      nombre: nombreInput.value.trim(),
      cedula: cedulaInput.value.trim(),
      email: emailInput.value.trim(),
      celular: celularInput.value.trim(),
      tipo: selectedRole || 'No especificado (Sin categoría seleccionada)',
      userAgent: navigator.userAgent
    };

    // Activar estado de carga en el botón
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      const appsScriptUrl = window.CONFIG.APPS_SCRIPT_URL;

      // MODO SIMULACIÓN LOCAL (si no se ha configurado la URL en config.js)
      if (!appsScriptUrl || appsScriptUrl.trim() === '') {
        await new Promise(r => setTimeout(r, 900)); // Simulación de latencia

        const registros = JSON.parse(localStorage.getItem('metroville_test_registros') || '[]');

        // Verificar duplicados en prueba local
        if (registros.some(r => r.cedula === payload.cedula)) {
          throw new Error('Esta cédula ya fue registrada previamente en el modo de prueba.');
        }

        if (registros.length >= window.CONFIG.MAX_REGISTRACIONES) {
          throw new Error('Se ha alcanzado el límite máximo de cupos (73).');
        }

        registros.push({
          ...payload,
          fecha: new Date().toISOString()
        });
        localStorage.setItem('metroville_test_registros', JSON.stringify(registros));

        // Feedback
        abrirModalExito(payload);
        actualizarUIcupos(
          registros.length,
          window.CONFIG.MAX_REGISTRACIONES,
          window.CONFIG.MAX_REGISTRACIONES - registros.length
        );
        mostrarToast('Registro guardado localmente (Simulación de prueba). Configura la URL de Apps Script para enviar a Google Sheets real.', 'success');
        form.reset();
        resetFormState();
        return;
      }

      // MODO PRODUCCIÓN: Envío real a Google Apps Script
      // Usamos URLSearchParams o FormData con redirect manual para máxima compatibilidad CORS con Google Apps Script
      const formData = new URLSearchParams();
      formData.append('nombre', payload.nombre);
      formData.append('cedula', payload.cedula);
      formData.append('email', payload.email);
      formData.append('celular', payload.celular);
      formData.append('tipo', payload.tipo);
      formData.append('userAgent', payload.userAgent);

      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      const data = await response.json();

      if (data.status === 'success') {
        abrirModalExito(payload);
        if (data.totalRegistros !== undefined) {
          actualizarUIcupos(
            data.totalRegistros,
            data.limiteMaximo || window.CONFIG.MAX_REGISTRACIONES,
            data.cuposDisponibles
          );
        }
        form.reset();
        resetFormState();
      } else {
        throw new Error(data.message || 'No se pudo procesar el registro.');
      }

    } catch (error) {
      console.error('Error al registrar:', error);
      mostrarToast(error.message || 'Error de conexión con el servidor. Intenta nuevamente.', 'error');
    } finally {
      submitBtn.classList.remove('is-loading');
      if (!estaAgotado) {
        submitBtn.disabled = false;
      }
    }
  });

  // =========================================================================
  // 5. MODAL DE ÉXITO Y RESET
  // =========================================================================

  function abrirModalExito(datos) {
    summaryNombre.textContent = datos.nombre;
    summaryCedula.textContent = datos.cedula;
    summaryEmail.textContent = datos.email;
    summaryTipo.textContent = datos.tipo;

    successModal.classList.add('is-open');
    successModal.setAttribute('aria-hidden', 'false');
  }

  function cerrarModalExito() {
    successModal.classList.remove('is-open');
    successModal.setAttribute('aria-hidden', 'true');
  }

  modalCloseBtn.addEventListener('click', cerrarModalExito);
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      cerrarModalExito();
    }
  });

  function resetFormState() {
    selectedRole = null;
    [cardAlumni, cardOnline].forEach(c => {
      c.classList.remove('is-selected');
      c.setAttribute('aria-checked', 'false');
    });

    [nombreInput, cedulaInput, emailInput, celularInput].forEach(inp => {
      inp.classList.remove('is-valid', 'is-invalid');
    });

    nombreFeedback.textContent = 'Ingresa tu nombre y apellido completo (mínimo 2 palabras).';
    nombreFeedback.className = 'feedback-msg';

    cedulaFeedback.textContent = '10 dígitos (Validación oficial módulo 10).';
    cedulaFeedback.className = 'feedback-msg';

    emailFeedback.textContent = 'Te enviaremos la confirmación a esta dirección.';
    emailFeedback.className = 'feedback-msg';

    celularFeedback.textContent = 'Para avisos importantes del evento vía WhatsApp.';
    celularFeedback.className = 'feedback-msg';
  }

  // =========================================================================
  // 6. SISTEMA DE TOASTS
  // =========================================================================

  function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
      <span>${tipo === 'error' ? '⚠️' : '✅'}</span>
      <span>${mensaje}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Inicializar consulta inicial de cupos
  consultarCupos();
});

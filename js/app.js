/**
 * Metroville 2026 - Lógica de Aplicación
 * Manejo de Formulario, Validaciones en Tiempo Real, Control de Cupos e Integración
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
  let cedulasRegistradas = [];

  // =========================================================================
  // 1. GESTIÓN DE ROLES (MUTUAMENTE EXCLUYENTES O NINGUNO)
  // =========================================================================

  function actualizarSeleccionRol(nuevoRol, tarjetaElemento) {
    if (selectedRole === nuevoRol) {
      // Si hace clic en la que ya está seleccionada, se deselecciona (ninguna activa)
      selectedRole = null;
      tarjetaElemento.classList.remove('is-selected');
      tarjetaElemento.setAttribute('aria-checked', 'false');
    } else {
      // Deseleccionar todas
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
  // 2. VALIDACIONES EN TIEMPO REAL (LIMPIAS, SOLO MOSTRAR ERROR SI FALLA)
  // =========================================================================

  function setFieldState(input, feedbackEl, isValid, message) {
    if (isValid === true) {
      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
      if (feedbackEl) feedbackEl.textContent = '';
    } else if (isValid === false) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      if (feedbackEl) feedbackEl.textContent = message || 'Dato no válido';
    } else {
      input.classList.remove('is-valid', 'is-invalid');
      if (feedbackEl) feedbackEl.textContent = '';
    }
  }

  // Nombre y Apellido (Mínimo 2 palabras)
  nombreInput.addEventListener('input', () => {
    const val = nombreInput.value;
    if (val.trim() === '') {
      setFieldState(nombreInput, nombreFeedback, null, '');
      return;
    }
    const res = Validator.validarNombre(val);
    setFieldState(nombreInput, nombreFeedback, res.esValido, res.mensaje);
  });

  // Cédula de Ecuador (Módulo 10)
  cedulaInput.addEventListener('input', () => {
    cedulaInput.value = cedulaInput.value.replace(/\D/g, '').slice(0, 10);
    const val = cedulaInput.value;

    if (val.length === 0) {
      setFieldState(cedulaInput, cedulaFeedback, null, '');
      return;
    }

    if (val.length < 10) {
      setFieldState(cedulaInput, cedulaFeedback, false, `Faltan dígitos: ${val.length}/10`);
      return;
    }

    // Verificar si la cédula ya fue registrada previamente
    if (cedulasRegistradas.includes(val)) {
      setFieldState(cedulaInput, cedulaFeedback, false, 'Esta cédula ya se encuentra registrada para Metroville 2026.');
      return;
    }

    const res = Validator.validarCedulaEcuador(val);
    setFieldState(cedulaInput, cedulaFeedback, res.esValido, res.mensaje);
  });

  // Correo Electrónico
  emailInput.addEventListener('input', () => {
    const val = emailInput.value;
    if (val.trim() === '') {
      setFieldState(emailInput, emailFeedback, null, '');
      return;
    }
    const res = Validator.validarEmail(val);
    setFieldState(emailInput, emailFeedback, res.esValido, res.mensaje);
  });

  // Celular (Opcional)
  celularInput.addEventListener('input', () => {
    celularInput.value = celularInput.value.replace(/[^\d\s\-+()]/g, '');
    const val = celularInput.value;
    if (val.trim() === '') {
      setFieldState(celularInput, celularFeedback, null, '');
      return;
    }
    const res = Validator.validarCelular(val);
    setFieldState(celularInput, celularFeedback, res.esValido, res.mensaje);
  });

  // =========================================================================
  // 3. CONTROL DE CUPOS (MÁXIMO 73 INTERNO)
  // =========================================================================

  function actualizarEstadoCupos(total, max, disponibles) {
    totalRegistrados = total;
    cuposDisponibles = disponibles;
    estaAgotado = disponibles <= 0;

    if (estaAgotado) {
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Cupos Agotados';
    } else {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Confirmar Registro';
    }
  }

  async function consultarCupos() {
    const url = window.CONFIG.APPS_SCRIPT_URL;

    // Cargar cédulas guardadas en este dispositivo
    const guardadasLocal = JSON.parse(localStorage.getItem('metroville_cedulas_registradas') || '[]');
    cedulasRegistradas = [...new Set([...cedulasRegistradas, ...guardadasLocal])];

    // Si aún no se configuró la URL, usar simulación local
    if (!url || url.trim() === '') {
      const registrosLocales = JSON.parse(localStorage.getItem('metroville_test_registros') || '[]');
      const total = registrosLocales.length;
      const max = window.CONFIG.MAX_REGISTRACIONES || 73;
      cedulasRegistradas = [...new Set([...cedulasRegistradas, ...registrosLocales.map(r => r.cedula)])];
      actualizarEstadoCupos(total, max, Math.max(0, max - total));
      return;
    }

    try {
      const response = await fetch(`${url}?action=getQuota`, { method: 'GET', mode: 'cors' });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          if (data.cedulasRegistradas && Array.isArray(data.cedulasRegistradas)) {
            cedulasRegistradas = [...new Set([...cedulasRegistradas, ...data.cedulasRegistradas])];
          }
          actualizarEstadoCupos(
            data.totalRegistros || 0,
            data.limiteMaximo || window.CONFIG.MAX_REGISTRACIONES,
            data.cuposDisponibles !== undefined ? data.cuposDisponibles : (window.CONFIG.MAX_REGISTRACIONES - data.totalRegistros)
          );
        }
      }
    } catch (err) {
      console.warn('Control de cupos fallback:', err);
    }
  }

  // =========================================================================
  // 4. ENVÍO DEL FORMULARIO
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

    // Validar Cédula única
    const cedulaVal = cedulaInput.value.trim();
    if (cedulasRegistradas.includes(cedulaVal)) {
      setFieldState(cedulaInput, cedulaFeedback, false, 'Esta cédula ya se encuentra registrada para Metroville 2026.');
      mostrarToast('Esta cédula ya se encuentra registrada en la lista de asistentes.', 'error');
      cedulaInput.focus();
      return;
    }

    const payload = {
      nombre: nombreInput.value.trim(),
      cedula: cedulaInput.value.trim(),
      email: emailInput.value.trim(),
      celular: celularInput.value.trim(),
      tipo: selectedRole || 'No especificado (Sin categoría)',
      userAgent: navigator.userAgent
    };

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      const appsScriptUrl = window.CONFIG.APPS_SCRIPT_URL;

      // SIMULACIÓN LOCAL (si no hay URL en config.js)
      if (!appsScriptUrl || appsScriptUrl.trim() === '') {
        await new Promise(r => setTimeout(r, 800));

        const registros = JSON.parse(localStorage.getItem('metroville_test_registros') || '[]');

        if (registros.some(r => r.cedula === payload.cedula)) {
          throw new Error('Esta cédula ya fue registrada previamente en la prueba.');
        }

        if (registros.length >= window.CONFIG.MAX_REGISTRACIONES) {
          throw new Error('Se ha alcanzado el límite de 73 registros.');
        }

        registros.push({ ...payload, fecha: new Date().toISOString() });
        localStorage.setItem('metroville_test_registros', JSON.stringify(registros));

        abrirModalExito(payload);
        actualizarEstadoCupos(
          registros.length,
          window.CONFIG.MAX_REGISTRACIONES,
          window.CONFIG.MAX_REGISTRACIONES - registros.length
        );
        form.reset();
        resetFormState();
        return;
      }

      // ENVÍO REAL A GOOGLE APPS SCRIPT
      // Implementación idéntica a la probada con éxito en el Test Vocacional:
      // (mode: 'no-cors' con Content-Type: text/plain evita bloqueos de redirección 302 y CORS)
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
      } catch (fetchErr) {
        console.warn('Fallback a GET:', fetchErr);
        const queryParams = new URLSearchParams(payload).toString();
        await fetch(`${appsScriptUrl}?${queryParams}`, {
          method: 'GET',
          mode: 'no-cors'
        });
      }

      // Guardar cédula para bloquear reenvíos inmediatos
      cedulasRegistradas.push(payload.cedula);
      const guardadas = JSON.parse(localStorage.getItem('metroville_cedulas_registradas') || '[]');
      if (!guardadas.includes(payload.cedula)) {
        guardadas.push(payload.cedula);
        localStorage.setItem('metroville_cedulas_registradas', JSON.stringify(guardadas));
      }

      // Registro completado y registrado en Google Sheets
      abrirModalExito(payload);
      form.reset();
      resetFormState();
      
      // Actualizar contador silencioso
      setTimeout(consultarCupos, 2000);

    } catch (error) {
      console.error('Error al registrar:', error);
      mostrarToast(error.message || 'Error de conexión. Intenta nuevamente.', 'error');
    } finally {
      submitBtn.classList.remove('is-loading');
      if (!estaAgotado) {
        submitBtn.disabled = false;
      }
    }
  });

  // =========================================================================
  // 5. MODAL DE ÉXITO
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
    if (e.target === successModal) cerrarModalExito();
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

    [nombreFeedback, cedulaFeedback, emailFeedback, celularFeedback].forEach(f => {
      if (f) f.textContent = '';
    });
  }

  // =========================================================================
  // 6. TOAST NOTIFICACIONES
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

  // Comprobar cupos iniciales
  consultarCupos();
});

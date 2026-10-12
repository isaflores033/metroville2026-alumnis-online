/**
 * Módulo de Validaciones para Metroville 2026
 */

const Validator = {
  /**
   * Valida Nombre y Apellido:
   * Obligatorio y debe contener como mínimo 2 palabras.
   */
  validarNombre(nombre) {
    if (!nombre || typeof nombre !== 'string') {
      return { esValido: false, mensaje: 'El nombre y apellido es obligatorio.' };
    }

    const palabras = nombre.trim().split(/\s+/).filter(p => p.length >= 2);
    if (palabras.length < 2) {
      return {
        esValido: false,
        mensaje: 'Debes ingresar al menos 2 palabras (Nombre y Apellido).'
      };
    }

    // Comprobar que solo tenga letras y caracteres permitidos
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    if (!regexLetras.test(nombre.trim())) {
      return {
        esValido: false,
        mensaje: 'El nombre solo debe contener letras.'
      };
    }

    return { esValido: true, mensaje: 'Nombre válido.' };
  },

  /**
   * Valida Cédula de Identidad de Ecuador:
   * 1. 10 dígitos numéricos exactos.
   * 2. Código de provincia válido (01 a 24 o 30 para ecuatorianos en el exterior).
   * 3. Tercer dígito menor a 6 (personas naturales).
   * 4. Algoritmo Módulo 10 con coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2].
   */
  validarCedulaEcuador(cedula) {
    if (!cedula || typeof cedula !== 'string') {
      return { esValido: false, mensaje: 'La cédula es obligatoria.' };
    }

    const digitos = cedula.trim();

    if (!/^\d+$/.test(digitos)) {
      return { esValido: false, mensaje: 'La cédula debe contener solo números.' };
    }

    if (digitos.length !== 10) {
      return {
        esValido: false,
        mensaje: `Debe tener exactamente 10 dígitos (actualmente tiene ${digitos.length}).`
      };
    }

    // 1. Validar Provincia
    const provincia = parseInt(digitos.substring(0, 2), 10);
    if ((provincia < 1 || provincia > 24) && provincia !== 30) {
      return {
        esValido: false,
        mensaje: 'Los 2 primeros dígitos no corresponden a una provincia válida del Ecuador.'
      };
    }

    // 2. Validar Tercer Dígito (Personas naturales debe ser < 6)
    const tercerDigito = parseInt(digitos.charAt(2), 10);
    if (tercerDigito >= 6) {
      return {
        esValido: false,
        mensaje: 'El tercer dígito debe ser menor a 6 para cédulas de personas naturales.'
      };
    }

    // 3. Algoritmo Módulo 10
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let producto = parseInt(digitos.charAt(i), 10) * coeficientes[i];
      if (producto >= 10) {
        producto -= 9;
      }
      suma += producto;
    }

    const residuo = suma % 10;
    const digitoVerificadorCalculado = residuo === 0 ? 0 : 10 - residuo;
    const digitoVerificadorReal = parseInt(digitos.charAt(9), 10);

    if (digitoVerificadorCalculado !== digitoVerificadorReal) {
      return {
        esValido: false,
        mensaje: 'La cédula ingresada no es válida según el algoritmo de verificación.'
      };
    }

    return { esValido: true, mensaje: 'Cédula ecuatoriana válida.' };
  },

  /**
   * Valida Correo Electrónico:
   * Obligatorio y formato de email válido.
   */
  validarEmail(email) {
    if (!email || typeof email !== 'string') {
      return { esValido: false, mensaje: 'El correo electrónico es obligatorio.' };
    }

    const emailLimpio = email.trim();
    // Expresión regular estándar y segura para emails
    const regexEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!regexEmail.test(emailLimpio)) {
      return { esValido: false, mensaje: 'Ingresa un correo electrónico con formato válido.' };
    }

    return { esValido: true, mensaje: 'Correo válido.' };
  },

  /**
   * Valida Celular (Opcional):
   * Si se ingresa, se recomienda formato ecuatoriano de 10 dígitos (inicia con 09).
   */
  validarCelular(celular) {
    if (!celular || celular.trim() === '') {
      return { esValido: true, mensaje: '' }; // Opcional
    }

    const celularLimpio = celular.replace(/[\s\-()]/g, '');

    if (!/^\d+$/.test(celularLimpio)) {
      return { esValido: false, mensaje: 'El celular debe contener solo números.' };
    }

    if (celularLimpio.length < 9 || celularLimpio.length > 12) {
      return {
        esValido: false,
        mensaje: 'El número de celular debe tener entre 9 y 10 dígitos.'
      };
    }

    return { esValido: true, mensaje: 'Celular válido.' };
  }
};

window.Validator = Validator;

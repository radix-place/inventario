// =====================================================
// SEGURIDAD VISUAL - RODIZIO DO SUL
// Este archivo NO contiene la clave real.
// La clave real se valida en Apps Script.
// =====================================================

let PASSWORD_SESION = "";

function obtenerPasswordSesion() {
  return PASSWORD_SESION;
}

function validarAccesoLocal() {
  const input = document.getElementById("passwordAcceso");
  const mensaje = document.getElementById("mensajeAcceso");

  if (!input) {
    alert("No existe el campo passwordAcceso.");
    return;
  }

  const password = input.value.trim();

  if (password === "") {
    if (mensaje) {
      mensaje.textContent = "Ingresa la clave de acceso.";
    }
    return;
  }

  if (typeof GOOGLE_SCRIPT_URL === "undefined") {
    if (mensaje) {
      mensaje.textContent = "No se encontró la URL de Apps Script.";
    }
    return;
  }

  if (mensaje) {
    mensaje.textContent = "Validando acceso...";
  }

  const callbackName = "callbackLogin_" + Date.now();

  window[callbackName] = function(respuesta) {
    delete window[callbackName];

    const script = document.getElementById(callbackName);

    if (script) {
      script.remove();
    }

    if (!respuesta || !respuesta.ok) {
      PASSWORD_SESION = "";

      if (mensaje) {
        mensaje.textContent = "Clave incorrecta.";
      }

      return;
    }

    PASSWORD_SESION = password;

    const pantallaAcceso = document.getElementById("pantallaAcceso");
    const appInventario = document.getElementById("appInventario");

    if (pantallaAcceso) {
      pantallaAcceso.classList.add("oculto");
    }

    if (appInventario) {
      appInventario.classList.remove("oculto");
    }

    input.value = "";

    if (mensaje) {
      mensaje.textContent = "";
    }
  };

  const url =
    GOOGLE_SCRIPT_URL +
    "?accion=LOGIN" +
    "&password=" + encodeURIComponent(password) +
    "&callback=" + callbackName;

  const script = document.createElement("script");
  script.id = callbackName;
  script.src = url;

  script.onerror = function() {
    delete window[callbackName];

    if (mensaje) {
      mensaje.textContent = "No se pudo validar el acceso.";
    }

    script.remove();
  };

  document.body.appendChild(script);
}

function cerrarSesion() {
  PASSWORD_SESION = "";

  const pantallaAcceso = document.getElementById("pantallaAcceso");
  const appInventario = document.getElementById("appInventario");

  if (appInventario) {
    appInventario.classList.add("oculto");
  }

  if (pantallaAcceso) {
    pantallaAcceso.classList.remove("oculto");
  }

  if (typeof reiniciarApp === "function") {
    reiniciarApp();
  }
}
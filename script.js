// =====================================================
// INVENTARIO RODIZIO DO SUL
// Flujo guiado:
// 1. Registrar apertura: cantidades iniciales en kg
// 2. Registrar cierre: cantidades finales en kg + platos vendidos
// 3. Consultar existencias: lee último cierre registrado
//
// No calcula consumo.
// No resta apertura - cierre.
// Solo registra cantidades ingresadas por el chef.
// =====================================================

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzl_1dtmxpkXiazW0ZtlEplXJa7wWliLsflfwY4DfStyEp3swc5ZV98to7LnpYpFMkm/exec";

// Control para evitar doble envío
let ENVIANDO = false;

// =====================================================
// PRODUCTOS DE INVENTARIO
// =====================================================

const productos = [
  "Punta de anca",
  "Morrillo",
  "Cadera",
  "Lomo viche",
  "Costilla de cerdo",
  "Lomo de caracho angus importado",
  "Bondiola de cerdo",
  "Chorizo",
  "Muslos de pollo",
  "Corazones de pollo",
  "Ubre"
];

// =====================================================
// PLATOS VENDIDOS
// =====================================================

const platos = [
  "Rodizio",
  "Rodizio Premium",
  "Picanha 300g",
  "Picanha 450g",
  "New York Steak",
  "Rib Eye",
  "Morrillo",
  "Churrasco",
  "Baby Beef",
  "Lomo en Salsa de Trufa Negra",
  "Filet Mignon",
  "Salmón a la Parrilla",
  "Salmón Fruto del Mar",
  "Langostinos Do Sul",
  "Langostinos al Ajillo",
  "File de Frango",
  "Ensalada César con pollo",
  "Pasta en Salsa de Trufa y Hongos - Res",
  "Pasta en Salsa de Trufa y Hongos - Pollo"
];

// =====================================================
// ELEMENTOS DEL HTML
// =====================================================

const pantallaInicio = document.getElementById("pantallaInicio");
const datosGenerales = document.getElementById("datosGenerales");

const seccionApertura = document.getElementById("seccionApertura");
const seccionCierre = document.getElementById("seccionCierre");

const productosApertura = document.getElementById("productosApertura");
const productosCierre = document.getElementById("productosCierre");
const ventasCierre = document.getElementById("ventasCierre");

const seccionExistencias = document.getElementById("seccionExistencias");
const resultadoExistencias = document.getElementById("resultadoExistencias");

// =====================================================
// FECHA LOCAL
// =====================================================

function fechaActual() {
  const hoy = new Date();

  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

// =====================================================
// RESPONSABLE
// =====================================================

function obtenerResponsable() {
  const input = document.getElementById("responsable");

  if (!input) {
    return "";
  }

  return input.value.trim();
}

// =====================================================
// CONTROL DE PANTALLAS
// =====================================================

function ocultarTodo() {
  if (pantallaInicio) pantallaInicio.classList.add("oculto");
  if (datosGenerales) datosGenerales.classList.add("oculto");
  if (seccionApertura) seccionApertura.classList.add("oculto");
  if (seccionCierre) seccionCierre.classList.add("oculto");
  if (seccionExistencias) seccionExistencias.classList.add("oculto");
}

function mostrarApertura() {
  if (ENVIANDO) return;

  ocultarTodo();

  datosGenerales.classList.remove("oculto");
  seccionApertura.classList.remove("oculto");

  cargarProductosApertura();
}

function mostrarCierre() {
  if (ENVIANDO) return;

  ocultarTodo();

  datosGenerales.classList.remove("oculto");
  seccionCierre.classList.remove("oculto");

  cargarProductosCierre();
  cargarVentasCierre();
}

function mostrarExistencias() {
  if (ENVIANDO) return;

  ocultarTodo();

  if (seccionExistencias) {
    seccionExistencias.classList.remove("oculto");
  }

  consultarExistencias();
}

function reiniciarApp() {
  if (ENVIANDO) return;

  limpiarCampos();
  ocultarTodo();

  pantallaInicio.classList.remove("oculto");
}

// =====================================================
// CARGAR PRODUCTOS DE APERTURA
// =====================================================

function cargarProductosApertura() {
  productosApertura.innerHTML = "";

  productos.forEach(producto => {
    productosApertura.innerHTML += `
      <div class="item">
        <label>${producto}</label>

        <input
          type="number"
          step="0.001"
          min="0"
          data-apertura="${producto}"
          placeholder="Cantidad inicial en kg"
        >
      </div>
    `;
  });
}

// =====================================================
// CARGAR PRODUCTOS DE CIERRE
// =====================================================

function cargarProductosCierre() {
  productosCierre.innerHTML = "";

  productos.forEach(producto => {
    productosCierre.innerHTML += `
      <div class="item">
        <label>${producto}</label>

        <input
          type="number"
          step="0.001"
          min="0"
          data-cierre="${producto}"
          placeholder="Cantidad final en kg"
        >
      </div>
    `;
  });
}

// =====================================================
// CARGAR PLATOS VENDIDOS EN CIERRE
// =====================================================

function cargarVentasCierre() {
  ventasCierre.innerHTML = "";

  platos.forEach(plato => {
    ventasCierre.innerHTML += `
      <div class="item">
        <label>${plato}</label>

        <input
          type="number"
          step="1"
          min="0"
          data-plato="${plato}"
          placeholder="Cantidad vendida"
        >
      </div>
    `;
  });
}

// =====================================================
// BLOQUEO Y RESTAURACIÓN DE BOTONES
// =====================================================

function bloquearBotones() {
  const botones = document.querySelectorAll("button");

  botones.forEach(boton => {
    boton.disabled = true;

    const accion = boton.getAttribute("onclick");

    if (
      accion === "guardarApertura()" ||
      accion === "guardarCierre()" ||
      accion === "mostrarExistencias()"
    ) {
      boton.textContent = "Procesando...";
    }
  });
}

function desbloquearBotones() {
  const botones = document.querySelectorAll("button");

  botones.forEach(boton => {
    boton.disabled = false;
  });

  restaurarTextosBotones();
}

function restaurarTextosBotones() {
  const botones = document.querySelectorAll("button");

  botones.forEach(boton => {
    const accion = boton.getAttribute("onclick");

    if (accion === "mostrarApertura()") {
      boton.textContent = "Registrar apertura";
    }

    if (accion === "mostrarCierre()") {
      boton.textContent = "Registrar cierre";
    }

    if (accion === "mostrarExistencias()") {
      boton.textContent = "Consultar existencias";
    }

    if (accion === "guardarApertura()") {
      boton.textContent = "Guardar apertura";
    }

    if (accion === "guardarCierre()") {
      boton.textContent = "Guardar cierre";
    }

    if (accion === "reiniciarApp()") {
      boton.textContent = "Regresar / reiniciar";
    }
  });
}

// =====================================================
// ENVÍO A GOOGLE SHEETS
// =====================================================

async function enviarAGoogleSheets(payload) {
  if (ENVIANDO) {
    return;
  }

  ENVIANDO = true;
  bloquearBotones();

  console.log("Payload enviado:", payload);

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    alert("Registro enviado a Google Sheets.");

    limpiarCampos();
    ocultarTodo();
    pantallaInicio.classList.remove("oculto");

  } catch (error) {
    console.error("Error al enviar:", error);
    alert("No se pudieron enviar los datos.");

  } finally {
    ENVIANDO = false;
    desbloquearBotones();
  }
}

// =====================================================
// CONSULTAR EXISTENCIAS
// Lee la última fila de la hoja Existencias.
// No redondea ni aproxima valores.
// =====================================================

async function consultarExistencias() {
  if (!resultadoExistencias) {
    alert("Falta el contenedor resultadoExistencias en el index.html.");
    return;
  }

  resultadoExistencias.innerHTML = `
    <p class="descripcion">Consultando existencias...</p>
  `;

  try {
    const url = `${GOOGLE_SCRIPT_URL}?accion=EXISTENCIAS`;

    const respuesta = await fetch(url, {
      method: "GET"
    });

    const data = await respuesta.json();

    if (!data.ok) {
      resultadoExistencias.innerHTML = `
        <p>No se pudieron consultar las existencias.</p>
        <p>${data.error || ""}</p>
      `;
      return;
    }

    if (!data.existencias || Object.keys(data.existencias).length === 0) {
      resultadoExistencias.innerHTML = `
        <p>No hay existencias registradas todavía.</p>
      `;
      return;
    }

    mostrarTablaExistencias(data);

  } catch (error) {
    console.error("Error al consultar existencias:", error);

    resultadoExistencias.innerHTML = `
      <p>No se pudo leer la hoja de existencias.</p>
      <p>Revisa que el Apps Script tenga la función doGet(e) y que la implementación esté actualizada.</p>
    `;
  }
}

function mostrarTablaExistencias(data) {
  let html = `
    <p class="descripcion">
      Existencias al cierre del <strong>${data.fecha}</strong>
    </p>

    <table class="tabla-existencias">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad kg</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.entries(data.existencias).forEach(([producto, cantidad]) => {
    const valor = mostrarValorSinRedondear(cantidad);

    html += `
      <tr>
        <td>${producto}</td>
        <td>${valor}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  resultadoExistencias.innerHTML = html;
}

// =====================================================
// FORMATO DE VALORES
// No aproxima.
// No usa toFixed.
// Solo muestra 0 si viene vacío.
// =====================================================

function mostrarValorSinRedondear(valor) {
  if (valor === "" || valor === null || valor === undefined) {
    return 0;
  }

  return valor;
}

// =====================================================
// GUARDAR APERTURA
// Escribe cantidades iniciales en kg.
// No calcula consumo.
// =====================================================

function guardarApertura() {
  if (ENVIANDO) return;

  const responsable = obtenerResponsable();
  const inputs = document.querySelectorAll("[data-apertura]");

  const registros = [];

  inputs.forEach(input => {
    if (input.value !== "") {
      registros.push({
        fecha: fechaActual(),
        producto: input.dataset.apertura,
        pesoAperturaKg: Number(input.value),
        responsableApertura: responsable
      });
    }
  });

  if (registros.length === 0) {
    alert("No hay datos de apertura para guardar.");
    return;
  }

  enviarAGoogleSheets({
    accion: "APERTURA",
    registros: registros
  });
}

// =====================================================
// GUARDAR CIERRE
// Guarda:
// 1. Cantidad final de todas las carnes en kg
// 2. Número de platos vendidos
//
// No calcula consumo.
// Si una carne queda vacía, se registra como 0 kg.
// =====================================================

function guardarCierre() {
  if (ENVIANDO) return;

  const responsable = obtenerResponsable();

  const inputsCarnes = document.querySelectorAll("[data-cierre]");
  const inputsPlatos = document.querySelectorAll("[data-plato]");

  const carnes = [];
  const ventas = [];

  // -----------------------------------------------------
  // CARNES
  // -----------------------------------------------------
  // En cierre se envían TODAS las carnes.
  // Si el campo queda vacío, se registra 0 kg.

  inputsCarnes.forEach(input => {
    const valor = input.value === "" ? 0 : Number(input.value);

    carnes.push({
      fecha: fechaActual(),
      producto: input.dataset.cierre,
      pesoCierreKg: valor,
      responsableCierre: responsable
    });
  });

  // -----------------------------------------------------
  // VENTAS
  // -----------------------------------------------------
  // Las ventas se envían solo si tienen cantidad digitada.

  inputsPlatos.forEach(input => {
    if (input.value !== "") {
      ventas.push({
        fecha: fechaActual(),
        plato: input.dataset.plato,
        cantidad: Number(input.value),
        responsable: responsable
      });
    }
  });

  if (carnes.length === 0 && ventas.length === 0) {
    alert("No hay datos de cierre para guardar.");
    return;
  }

  enviarAGoogleSheets({
    accion: "CIERRE",
    carnes: carnes,
    ventas: ventas
  });
}

// =====================================================
// LIMPIEZA
// =====================================================

function limpiarCampos() {
  document.querySelectorAll("input").forEach(input => {
    input.value = "";
  });

  productosApertura.innerHTML = "";
  productosCierre.innerHTML = "";
  ventasCierre.innerHTML = "";

  if (resultadoExistencias) {
    resultadoExistencias.innerHTML = "";
  }
}
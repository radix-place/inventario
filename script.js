// =====================================================
// INVENTARIO RODIZIO DO SUL
// Flujo guiado:
// 1. Registrar apertura: cantidades iniciales en kg
// 2. Registrar entrada: carne que llega durante el día
// 3. Registrar cierre: cantidades finales en kg + platos vendidos
// 4. Consultar existencias: lee último cierre registrado
//
// No calcula consumo.
// No resta apertura - cierre.
// Solo registra cantidades ingresadas por el chef.
// =====================================================

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-nDOggI-YG_NklTdyMQp1xOK8iLd0ZLpR5-51oXPqvljvwl5n46Ayf-hcN70hoUDe/exec";

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
const seccionEntrada = document.getElementById("seccionEntrada");
const seccionCierre = document.getElementById("seccionCierre");
const seccionExistencias = document.getElementById("seccionExistencias");

const productosApertura = document.getElementById("productosApertura");
const productosEntrada = document.getElementById("productosEntrada");
const productosCierre = document.getElementById("productosCierre");
const ventasCierre = document.getElementById("ventasCierre");

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
// VALIDACIÓN Y CONVERSIÓN DE KILOGRAMOS
//
// Regla:
// - Se aceptan enteros o números con máximo dos decimales.
// - Se acepta punto o coma decimal.
// - No se aceptan tres decimales.
// - No se redondea silenciosamente.
// - Si el chef escribe 5.05, se envía 5.05.
// - Si el chef escribe 1.79, se envía 1.79.
// =====================================================

function normalizarKg(valor) {
  if (valor === "" || valor === null || valor === undefined) {
    return "";
  }

  const texto = String(valor).trim().replace(",", ".");

  // Válidos: 5, 5.0, 5.05, 1.79, 0.53
  // Inválidos: 5.048, 1.789, 2..4, abc
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    return null;
  }

  const partes = texto.split(".");
  const entero = partes[0];
  const decimal = partes[1] || "";

  const centesimasTexto = decimal.padEnd(2, "0");

  const totalCentesimas =
    Number(entero) * 100 + Number(centesimasTexto);

  return totalCentesimas / 100;
}

function validarKg(valor, nombreCampo) {
  const kg = normalizarKg(valor);

  if (kg === null) {
    alert(
      "El valor de " +
      nombreCampo +
      " no es válido. Usa máximo dos decimales. Ejemplo: 5.05"
    );

    return null;
  }

  return kg;
}

// =====================================================
// CONTROL DE PANTALLAS
// =====================================================

function ocultarTodo() {
  if (pantallaInicio) pantallaInicio.classList.add("oculto");
  if (datosGenerales) datosGenerales.classList.add("oculto");
  if (seccionApertura) seccionApertura.classList.add("oculto");
  if (seccionEntrada) seccionEntrada.classList.add("oculto");
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

function mostrarEntrada() {
  if (ENVIANDO) return;

  ocultarTodo();

  datosGenerales.classList.remove("oculto");

  if (seccionEntrada) {
    seccionEntrada.classList.remove("oculto");
  }

  cargarProductosEntrada();
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
          type="text"
          inputmode="decimal"
          data-apertura="${producto}"
          placeholder="Cantidad inicial en kg. Ej: 5.05"
        >
      </div>
    `;
  });
}

// =====================================================
// CARGAR ENTRADA DE CARNE
// =====================================================

function cargarProductosEntrada() {
  if (!productosEntrada) return;

  productosEntrada.innerHTML = `
    <div class="item">
      <label for="productoEntrada">Producto</label>

      <select id="productoEntrada">
        <option value="">Selecciona una carne</option>
        ${productos.map(producto => `
          <option value="${producto}">${producto}</option>
        `).join("")}
      </select>
    </div>

    <div class="item">
      <label for="cantidadEntrada">Cantidad recibida en kg</label>

      <input
        type="text"
        inputmode="decimal"
        id="cantidadEntrada"
        placeholder="Cantidad en kg. Ej: 5.05"
      >
    </div>
  `;
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
          type="text"
          inputmode="decimal"
          data-cierre="${producto}"
          placeholder="Cantidad final en kg. Ej: 5.05"
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
      accion === "guardarEntrada()" ||
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

    if (accion === "mostrarEntrada()") {
      boton.textContent = "Registrar entrada de carne";
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

    if (accion === "guardarEntrada()") {
      boton.textContent = "Guardar entrada";
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
// No redondea visualmente.
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
    const valor = mostrarValor(cantidad);

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

function mostrarValor(valor) {
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

  for (const input of inputs) {
    if (input.value !== "") {
      const valorKg = validarKg(input.value, input.dataset.apertura);

      if (valorKg === null) {
        return;
      }

      registros.push({
        fecha: fechaActual(),
        producto: input.dataset.apertura,
        pesoAperturaKg: valorKg,
        responsableApertura: responsable
      });
    }
  }

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
// GUARDAR ENTRADA DE CARNE
// Registra carne que llega durante el día.
// No modifica apertura.
// No modifica cierre.
// No modifica existencias.
// Solo agrega una fila en hoja Entradas.
// =====================================================

function guardarEntrada() {
  if (ENVIANDO) return;

  const responsable = obtenerResponsable();

  const productoInput = document.getElementById("productoEntrada");
  const cantidadInput = document.getElementById("cantidadEntrada");

  if (!productoInput || !cantidadInput) {
    alert("Faltan los campos de entrada en el formulario.");
    return;
  }

  const producto = productoInput.value;

  if (producto === "") {
    alert("Selecciona una carne.");
    return;
  }

  const cantidad = validarKg(cantidadInput.value, "Cantidad recibida");

  if (cantidad === null || cantidad === "" || cantidad <= 0) {
    alert("Ingresa una cantidad válida en kg.");
    return;
  }

  enviarAGoogleSheets({
    accion: "ENTRADA",
    entrada: {
      fecha: fechaActual(),
      producto: producto,
      cantidadKg: cantidad,
      responsable: responsable
    }
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

  for (const input of inputsCarnes) {
    let valorKg = 0;

    if (input.value !== "") {
      valorKg = validarKg(input.value, input.dataset.cierre);

      if (valorKg === null) {
        return;
      }
    }

    carnes.push({
      fecha: fechaActual(),
      producto: input.dataset.cierre,
      pesoCierreKg: valorKg,
      responsableCierre: responsable
    });
  }

  // -----------------------------------------------------
  // VENTAS
  // -----------------------------------------------------
  // Las ventas se envían solo si tienen cantidad digitada.

  for (const input of inputsPlatos) {
    if (input.value !== "") {
      const cantidad = Number(input.value);

      if (!Number.isInteger(cantidad) || cantidad < 0) {
        alert(
          "La cantidad vendida de " +
          input.dataset.plato +
          " debe ser un número entero."
        );
        return;
      }

      ventas.push({
        fecha: fechaActual(),
        plato: input.dataset.plato,
        cantidad: cantidad,
        responsable: responsable
      });
    }
  }

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

  document.querySelectorAll("select").forEach(select => {
    select.value = "";
  });

  if (productosApertura) productosApertura.innerHTML = "";
  if (productosEntrada) productosEntrada.innerHTML = "";
  if (productosCierre) productosCierre.innerHTML = "";
  if (ventasCierre) ventasCierre.innerHTML = "";

  if (resultadoExistencias) {
    resultadoExistencias.innerHTML = "";
  }
}
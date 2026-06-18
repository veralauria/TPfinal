/* =========================================================================
   APLICACIÓN DE MONITOREO PIC16F887 - LDR & PWM
   =========================================================================
   Este script implementa:
     1. Conexión/desconexión vía Web Serial API.
     2. Lectura continua de tramas "L123\r\n" enviadas por el PIC.
     3. Envío de comandos de PWM (2 caracteres ASCII) hacia el PIC.
     4. Conversión ADC -> lux (función reemplazable).
     5. Gráfico en tiempo real con Chart.js (últimos 100 puntos).
     6. Registro de muestras en una tabla.
     7. Exportación de los datos a CSV.

   ¿Cómo funciona la Web Serial API?
   ----------------------------------
   La Web Serial API permite que una página web se comunique directamente
   con dispositivos seriales (UART, USB-UART, etc.) conectados a la PC.
   Pasos básicos:
     - navigator.serial.requestPort(): abre un diálogo del navegador para
       que el usuario seleccione el puerto COM/ttyUSB correspondiente.
     - port.open({baudRate}): abre la conexión con la velocidad indicada.
     - port.readable / port.writable: streams para leer y escribir bytes.
   Solo está disponible en navegadores basados en Chromium (Chrome, Edge)
   y requiere que la página se sirva en un contexto seguro (https o
   localhost).
   ========================================================================= */

/* ---------------------------------------------------------------------
   1. ESTADO GLOBAL Y REFERENCIAS A ELEMENTOS DEL DOM
   --------------------------------------------------------------------- */

// Objeto que guarda referencias al puerto serie y a sus streams.
const serialState = {
  port: null,            // Objeto SerialPort
  reader: null,          // Lector del stream de lectura (texto)
  writer: null,          // Escritor del stream de escritura (texto)
  readableStreamClosed: null,
  writableStreamClosed: null,
  keepReading: false,    // Bandera para controlar el bucle de lectura
};

// Buffer para acumular caracteres recibidos hasta encontrar \r\n
let lineBuffer = "";

// Arreglo donde se almacenan todas las muestras (para exportar a CSV).
// Cada elemento: { time: "HH:MM:SS", adc: number, lux: number }
const dataLog = [];

// Referencias a elementos del DOM
const btnConnect      = document.getElementById("btnConnect");
const btnDisconnect   = document.getElementById("btnDisconnect");
const baudrateSelect  = document.getElementById("baudrate");
const connectionStatus = document.getElementById("connectionStatus");

const pwmSlider   = document.getElementById("pwmSlider");
const pwmValue    = document.getElementById("pwmValue");
const btnSendPwm  = document.getElementById("btnSendPwm");

const adcBigValue   = document.getElementById("adcBigValue");
const adcProgressBar = document.getElementById("adcProgressBar");
const luxValueSpan  = document.getElementById("luxValue");

const dataTableBody = document.getElementById("dataTableBody");
const btnDownloadCsv = document.getElementById("btnDownloadCsv");

const indicatorConnection = document.getElementById("indicatorConnection");
const indicatorLastData   = document.getElementById("indicatorLastData");
const indicatorLastPwm    = document.getElementById("indicatorLastPwm");

/* ---------------------------------------------------------------------
   2. CONFIGURACIÓN DEL GRÁFICO (Chart.js)
   --------------------------------------------------------------------- */

const MAX_POINTS = 100; // Máximo de puntos visibles en el gráfico

const luxChartCtx = document.getElementById("luxChart").getContext("2d");

const luxChart = new Chart(luxChartCtx, {
  type: "line",
  data: {
    labels: [],            // Eje X: marcas de tiempo (HH:MM:SS)
    datasets: [
      {
        label: "Lux",
        data: [],          // Eje Y: valores de luminosidad
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.15)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Sin animación para que la actualización sea fluida
    scales: {
      x: {
        ticks: { color: "#94a3b8", maxRotation: 0, autoSkip: true },
        grid: { color: "#334155" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#94a3b8" },
        grid: { color: "#334155" },
      },
    },
    plugins: {
      legend: {
        labels: { color: "#e2e8f0" },
      },
    },
  },
});

/**
 * Agrega un nuevo punto (tiempo, lux) al gráfico y elimina el más
 * antiguo si se supera el límite MAX_POINTS, generando el efecto de
 * "desplazamiento" en tiempo real.
 */
function updateChart(timeLabel, luxVal) {
  luxChart.data.labels.push(timeLabel);
  luxChart.data.datasets[0].data.push(luxVal);

  if (luxChart.data.labels.length > MAX_POINTS) {
    luxChart.data.labels.shift();
    luxChart.data.datasets[0].data.shift();
  }

  luxChart.update();
}

/* ---------------------------------------------------------------------
   3. CONVERSIÓN DE ADC A LUX
   --------------------------------------------------------------------- */

/**
 * convertAdcToLux(adcValue)
 * --------------------------------------------------------------
 * Función de conversión del valor crudo del ADC (0-255) a lux.
 *
 * >>> REEMPLAZAR ESTA ECUACIÓN <<<
 * Actualmente se usa una relación 1:1 (lux = adc) como placeholder.
 * Cuando se obtenga la curva de calibración real del LDR (por ejemplo,
 * mediante una regresión con un luxómetro de referencia), reemplazar
 * el cuerpo de esta función. Ejemplo de una posible ecuación futura:
 *
 *   function convertAdcToLux(adcValue) {
 *     // Ejemplo: lux = A * exp(B * adcValue) + C
 *     const A = 2.5, B = 0.03, C = 1.2;
 *     return A * Math.exp(B * adcValue) + C;
 *   }
 *
 * @param {number} adcValue - Valor leído del ADC (0-255)
 * @returns {number} Valor estimado en lux
 */
function convertAdcToLux(adcValue) {
  // --- ECUACIÓN PLACEHOLDER: lux = ADC ---
  return adcValue;
}

/* ---------------------------------------------------------------------
   4. CONEXIÓN / DESCONEXIÓN SERIAL
   --------------------------------------------------------------------- */

/**
 * Solicita al usuario seleccionar un puerto serie, lo abre con la
 * velocidad seleccionada y comienza la lectura continua.
 */
async function connectSerial() {
  // Verificar soporte de la Web Serial API
  if (!("serial" in navigator)) {
    alert("Tu navegador no soporta la Web Serial API. Usa Chrome o Edge.");
    return;
  }

  try {
    // 1. Pedir al usuario que elija el puerto (abre el diálogo del navegador)
    const port = await navigator.serial.requestPort();

    // 2. Abrir el puerto con la velocidad seleccionada
    const baudRate = parseInt(baudrateSelect.value, 10);
    await port.open({ baudRate });

    serialState.port = port;
    serialState.keepReading = true;

    // 3. Preparar el stream de ESCRITURA (para enviar PWM al PIC)
    //    TextEncoderStream convierte strings JS a bytes UTF-8.
    const textEncoder = new TextEncoderStream();
    serialState.writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    serialState.writer = textEncoder.writable.getWriter();

    // 4. Preparar el stream de LECTURA (para recibir datos del ADC)
    //    TextDecoderStream convierte bytes recibidos a texto.
    const textDecoder = new TextDecoderStream();
    serialState.readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    serialState.reader = textDecoder.readable.getReader();

    // 5. Actualizar la interfaz para reflejar el estado "conectado"
    setUiConnected(true);

    // 6. Iniciar el bucle de lectura en segundo plano
    readLoop();
  } catch (error) {
    console.error("Error al conectar el puerto serie:", error);
    alert("No se pudo conectar al puerto serie: " + error.message);
  }
}

/**
 * Cierra los streams y el puerto serie, y restaura la interfaz al
 * estado "desconectado".
 */
async function disconnectSerial() {
  try {
    // Detener el bucle de lectura
    serialState.keepReading = false;

    // Cancelar el lector para que el bucle while() salga del read()
    if (serialState.reader) {
      await serialState.reader.cancel();
      await serialState.readableStreamClosed.catch(() => {});
      serialState.reader = null;
    }

    // Cerrar el escritor
    if (serialState.writer) {
      await serialState.writer.close();
      await serialState.writableStreamClosed.catch(() => {});
      serialState.writer = null;
    }

    // Cerrar el puerto
    if (serialState.port) {
      await serialState.port.close();
      serialState.port = null;
    }
  } catch (error) {
    console.error("Error al desconectar:", error);
  } finally {
    setUiConnected(false);
  }
}

/**
 * Bucle infinito que lee texto del puerto serie y lo va acumulando
 * en `lineBuffer` hasta encontrar un salto de línea (\r\n), momento
 * en el que se procesa la trama completa.
 */
async function readLoop() {
  while (serialState.keepReading) {
    try {
      const { value, done } = await serialState.reader.read();

      if (done) {
        // El stream fue cancelado (desconexión)
        break;
      }

      if (value) {
        lineBuffer += value;

        // Buscar tramas completas terminadas en \r\n
        let newlineIndex;
        while ((newlineIndex = lineBuffer.indexOf("\r\n")) >= 0) {
          const line = lineBuffer.slice(0, newlineIndex).trim();
          lineBuffer = lineBuffer.slice(newlineIndex + 2);

          if (line.length > 0) {
            processIncomingLine(line);
          }
        }
      }
    } catch (error) {
      console.error("Error de lectura serial:", error);
      break;
    }
  }
}

/**
 * Procesa una línea completa recibida del PIC con formato "Lxxx",
 * donde xxx es el valor ADC (000-255).
 *
 * @param {string} line - Línea recibida, ej: "L123"
 */
function processIncomingLine(line) {
  // Validar formato: comienza con 'L' seguido de 3 dígitos
  const match = line.match(/^L(\d{3})$/);

  if (!match) {
    console.warn("Trama con formato inesperado:", line);
    return;
  }

  const adcValue = parseInt(match[1], 10);

  if (Number.isNaN(adcValue)) {
    return;
  }

  // Convertir a lux usando la función reemplazable
  const luxVal = convertAdcToLux(adcValue);

  // Marca de tiempo actual (HH:MM:SS)
  const now = new Date();
  const timeLabel = now.toLocaleTimeString("es-ES", { hour12: false });

  // Actualizar la interfaz (valor grande, barra de progreso, lux)
  updateSensorDisplay(adcValue, luxVal);

  // Actualizar el gráfico en tiempo real
  updateChart(timeLabel, luxVal);

  // Agregar la muestra al registro y a la tabla
  addLogEntry(timeLabel, adcValue, luxVal);

  // Actualizar indicador de "último dato recibido"
  indicatorLastData.textContent = `ADC=${adcValue} (${timeLabel})`;
}

/* ---------------------------------------------------------------------
   5. ACTUALIZACIÓN DE LA INTERFAZ - SENSOR
   --------------------------------------------------------------------- */

/**
 * Actualiza el valor numérico grande, la barra de progreso y el
 * texto de luminosidad en lux.
 *
 * @param {number} adcValue - Valor ADC (0-255)
 * @param {number} luxVal   - Valor convertido en lux
 */
function updateSensorDisplay(adcValue, luxVal) {
  // Valor numérico grande
  adcBigValue.textContent = adcValue;

  // Barra de progreso (0-255 -> 0-100%)
  const percent = (adcValue / 255) * 100;
  adcProgressBar.style.width = `${percent}%`;

  // Texto de lux
  luxValueSpan.textContent = `Luz: ${luxVal} lux`;
}

/* ---------------------------------------------------------------------
   6. REGISTRO DE DATOS Y EXPORTACIÓN A CSV
   --------------------------------------------------------------------- */

/**
 * Agrega una nueva fila a la tabla de registro y al arreglo dataLog
 * (usado luego para generar el CSV).
 */
function addLogEntry(timeLabel, adcValue, luxVal) {
  // Guardar en el arreglo de datos
  dataLog.push({ time: timeLabel, adc: adcValue, lux: luxVal });

  // Crear y agregar la fila a la tabla
  const row = document.createElement("tr");

  const tdTime = document.createElement("td");
  tdTime.textContent = timeLabel;

  const tdAdc = document.createElement("td");
  tdAdc.textContent = adcValue;

  const tdLux = document.createElement("td");
  tdLux.textContent = luxVal;

  row.appendChild(tdTime);
  row.appendChild(tdAdc);
  row.appendChild(tdLux);

  dataTableBody.appendChild(row);

  // Auto-scroll hacia abajo para ver siempre la última fila
  const wrapper = dataTableBody.parentElement.parentElement; // .table-wrapper
  wrapper.scrollTop = wrapper.scrollHeight;
}

/**
 * Genera un archivo CSV a partir de dataLog y dispara su descarga
 * en el navegador.
 */
function downloadCsv() {
  if (dataLog.length === 0) {
    alert("No hay datos registrados todavía.");
    return;
  }

  // Construir el contenido CSV: encabezado + filas
  const header = "Hora,ADC,Lux\n";
  const rows = dataLog
    .map((entry) => `${entry.time},${entry.adc},${entry.lux}`)
    .join("\n");

  const csvContent = header + rows;

  // Crear un Blob y un enlace temporal para forzar la descarga
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `registro_ldr_${Date.now()}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------
   7. ENVÍO DE COMANDOS PWM AL PIC
   --------------------------------------------------------------------- */

/**
 * Envía el porcentaje de PWM al PIC como EXACTAMENTE 2 caracteres
 * ASCII (sin saltos de línea ni texto adicional).
 *
 * Ejemplos: 0 -> "00", 25 -> "25", 99 -> "99"
 */
async function sendPwmValue() {
  if (!serialState.writer) {
    alert("No hay una conexión serial activa.");
    return;
  }

  const percent = parseInt(pwmSlider.value, 10);

  // Formatear con cero a la izquierda si es necesario (2 dígitos)
  const command = percent.toString().padStart(2, "0");

  try {
    // Enviar la cadena de 2 caracteres por el puerto serie
    await serialState.writer.write(command);

    // Actualizar indicador de "último PWM enviado"
    indicatorLastPwm.textContent = `${command}%`;
  } catch (error) {
    console.error("Error al enviar el comando PWM:", error);
    alert("Error al enviar el comando PWM: " + error.message);
  }
}

/* ---------------------------------------------------------------------
   8. ACTUALIZACIÓN DE LA INTERFAZ - ESTADO DE CONEXIÓN
   --------------------------------------------------------------------- */

/**
 * Habilita/deshabilita los controles según el estado de la conexión
 * y actualiza los indicadores visuales correspondientes.
 *
 * @param {boolean} isConnected
 */
function setUiConnected(isConnected) {
  if (isConnected) {
    connectionStatus.textContent = "Conectado";
    connectionStatus.classList.remove("status-disconnected");
    connectionStatus.classList.add("status-connected");

    indicatorConnection.textContent = "Conectado";

    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
    btnSendPwm.disabled = false;
    baudrateSelect.disabled = true;
  } else {
    connectionStatus.textContent = "Desconectado";
    connectionStatus.classList.remove("status-connected");
    connectionStatus.classList.add("status-disconnected");

    indicatorConnection.textContent = "Desconectado";

    btnConnect.disabled = false;
    btnDisconnect.disabled = true;
    btnSendPwm.disabled = true;
    baudrateSelect.disabled = false;
  }
}

/* ---------------------------------------------------------------------
   9. EVENTOS DE LA INTERFAZ (SLIDER, BOTONES)
   --------------------------------------------------------------------- */

// Actualizar el texto del porcentaje mientras se mueve el slider
pwmSlider.addEventListener("input", () => {
  const val = parseInt(pwmSlider.value, 10).toString().padStart(2, "0");
  pwmValue.textContent = `${val}%`;
});

// Botón "Conectar"
btnConnect.addEventListener("click", connectSerial);

// Botón "Desconectar"
btnDisconnect.addEventListener("click", disconnectSerial);

// Botón "Enviar PWM"
btnSendPwm.addEventListener("click", sendPwmValue);

// Botón "Descargar CSV"
btnDownloadCsv.addEventListener("click", downloadCsv);

/* ---------------------------------------------------------------------
   10. INICIALIZACIÓN
   --------------------------------------------------------------------- */

// Establecer el texto inicial del slider al cargar la página
pwmValue.textContent = `${pwmSlider.value.padStart(2, "0")}%`;

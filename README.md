
# Lampara patron modulada por PWM para verificar funcionamiento de sensor fotorresistor
> **Asignatura:** Electrónica Digital II- - Universidad Nacional de Córdoba

> **Integrantes:**
> * Cometta Julian
> * Lauria Vera
>  * Pappalardo Dunger Francia

> **Profesor:** Ing Blasco Marcos

---

##  1. Descripción General del Proyecto 
El sistema permite sensar la intensidad luminosa mediante un sensor fotoresistivo (LDR). Para valuar su respuesta, se implementa una lámpara patrón de 12 V cuya intensidad luminosa puede regularse mediante una señal PWM (Pulse Width Modulation) generada por el PIC16F887 y aplicada a través de un MOSFET. El valor del PWM se modifica mediante comunicación UART desde una aplicación web desarrollada en HTML, CSS y JavaScript (Vanilla JS), la cual también recibe las mediciones del sensor, las grafica en función del tiempo y permite visualizar su evolución. Además, el sistema dispone de un botón para encender y apagar la lámpara de potencia y de un display de siete segmentos que muestra el valor digital de tres dígitos obtenido a partir de la conversión analógico-digital del sensor.

El sistema proporciona una fuente de iluminación controlada y reproducible, permitiendo evaluar la fidelidad y el comportamiento del sensor LDR frente a distintos niveles de iluminación. Está orientado a aplicaciones de laboratorio, donde resulta útil para la caracterización y calibración de sensores fotoresistivos.

### 🎯 Alcances del Proyecto (¿Qué hace y qué NO hace el sistema?)

* **El sistema SÍ es capaz de:**
* Medir intensidad luminica mediante un fotoresisteor (LDR) conectado a una entrada analogica del PIC16F887.
* Variar la intensidad de una lampara LED de 12 V por PWM.
* Recibir los datos sensados en la PC mediante UART.
* Graficar los datos de luminosidad obtenidos.
* Prender y apagar la lampara a traves de un pulsador.
* Mostrar los valores convertidos por el ADC en decimal en un display 7 segmentos.
* **El sistema NO incluye (Fuera de alcance):**
*  Conversion de los valores sensados a Lux.

### ⏩ Posibles Etapas Siguientes (Líneas Futuras)
Planteen cómo escalaría este desarrollo en una versión 2.0 o en un ámbito profesional:
*  Migrar el circuito de protoboard a un circuito impreso (PCB) diseñado bajo normas de compatibilidad electromagnética (EMC)
*  La función convertAdcToLux() en script.js actualmente usa lux = ADC como placeholder. Reemplazarla con una ecuación de calibración experimental para su correcta conversion.
* Considerar la no linealidad del sensor e incorporar una correccion por software mediante una ecuacion de correccion, con el fin de obtener una estimación más precisa de la iluminancia en lux.

---

## 📐 2. Arquitectura del Sistema: Hardware y Software (Común)

### 🔌 Hardware & Interconexión
* **Diagrama de Bloques:** [Insertar imagen o link al diagrama de bloques del hardware]
* **Esquemático del Circuito:** *[Inserte aquí la captura de imagen/render del esquemático completo desarrollado en KiCad/Altium]*
  `![Esquemático Completo](hardware/esquematico.png)`
* **Descripción del Circuito y Consideraciones de Diseño:**
* El sistema se implementa sobre una protoboard y aparte una PCB que integra la lámpara de potencia y el sensor LDR, alojados dentro de una caja negra para minimizar la incidencia de luz externa y las reflexiones, garantizando condiciones de medición más controladas.

* El microcontrolador PIC16F887 se alimenta con +5 V y GND mediante una placa Arduino utilizada como fuente de alimentación.

* Se conecta un display de 7 segmentos al puerto D del PIC mediante resistencias de 220 Ω. La multiplexación de los tres dígitos se realiza desde el puerto A utilizando tres transistores NPN para su conmutación.

* El módulo UART se conecta a los pines RC6 (TX) y RC7 (RX). El sensor LDR se conecta a la entrada analógica AN0 (RA0), mientras que el pulsador se conecta al pin RB0 para generar una interrupción externa por flanco descendente.

* El oscilador externo de 4 MHz se conecta a los pines RA6 (OSC2) y RA7 (OSC1). El pin MCLR se polariza mediante una resistencia pull-up de 10 kΩ conectada a +5 V.

* El control de la lámpara de 12 V se realiza mediante un MOSFET de canal N. El pin RC2/CCP1 del PIC se conecta a través de una resistencia de 220 Ω a la compuerta (Gate) del MOSFET para aplicar la señal PWM. Tambien se conecta a la compuerta una resistencia pull-down de 10k ohms. El terminal Drain se conecta al negativo de la lámpara y el Source se conecta directamente a tierra. El terminal positivo de la lámpara se alimenta mediante una fuente externa de 12 V.

**Consideraciones de diseño:**  Para el conexionado de las señales y de la alimentación de baja corriente se utilizaron conductores sólidos individuales extraídos de un cable UTP. En cambio, la alimentación de la lámpara LED de 12 V se realizó mediante un cable multifilar de mayor sección.

<img width="960" height="1280" alt="WhatsApp Image 2026-06-17 at 20 55 24" src="https://github.com/user-attachments/assets/570ad473-ae50-4e7a-9449-8eaeaaee774d" />

* Imagen 1: Circuito en protoboard
*<img width="1041" height="1280" alt="image" src="https://github.com/user-attachments/assets/6428cdef-92b3-419c-8ef8-73609a0f4110" />
* Imagen 2: Circuito en PCB
* 

### 💻 Arquitectura de Software (Firmware)
* **Diagrama de Flujo o Máquina de Estados:** *[Inserte aquí la imagen del diagrama que explique el lazo principal o el comportamiento del sistema]*
  `![Diagrama de Flujo / Máquina de Estados](docs/diagrama_software.png)`

---

## ⚡ 3. Especificaciones Eléctricas, Alimentación y Entorno (Específico por Asignatura)

### 🔌 Parámetros de Alimentación y Consumo (Común a ambas materias)
* **Tensión de operación del sistema:** 5V por USB
* **Método de alimentación:**  Fuente externa de 12V 
* **Consumo estimado o medido:** * En modo activo (máxima carga, relés/motores encendidos): `XX mA`
  * En modo bajo consumo (si aplica): `XX uA`

### 📌 [OPCIÓN A: Solo para alumnos de Electrónica Digital II (PIC16F887)]
* **Herramientas de Software:** MPLAB X IDE [vX.XX] y compilador XC8 [vX.XX].
* **Hardware de Programación/Depuración:** PICkit 3
* **Configuración de Bits (Fuses Críticos):**
  * *Oscilador:* HS Cristal externo de 4 MHz) 
  * *Watchdog Timer (WDT):* OFF
  * *Master Clear (MCLRE):* ON (Pin externo con pull up) 
* **Periféricos Internos Utilizados:** [Ej: Timer0, ADC, EUSART, PWM].
* **Gestión de Interrupciones:** Al contar con un único vector de interrupción, expliquen la prioridad por software (*polling*) en la ISR: ¿Qué bandera (`flag`) evalúan primero y por qué?

### 📌 [OPCIÓN B: Solo para alumnos de Electrónica Digital III (Cortex-M / ARM)]
* **IDE y SDK:** [Ej: MCUXpresso IDE v11.8 con LPCOpen v2.10 / STM32CubeIDE v1.14 con HAL v1.28].
* **Microcontrolador Principal:** [Ej: NXP LPC1769 / STM32F411].
* **Bibliotecas de Terceros y Versiones:** [Ej: FreeRTOS v10.5.1 / Biblioteca LCD I2C v1.2].
* **Periféricos Avanzados Utilizados:** [Ej: NVIC, DMA, SysTick, DAC].
* **Estrategia de Concurrencia:** Expliquen la arquitectura elegida: [Ej: Bare-metal con máquina de estados cooperativa / RTOS (FreeRTOS) detallando las tareas creadas y sus prioridades].

---

## 🔄 4. Proceso de Integración y Desarrollo (Común)
Describan cronológicamente cómo fueron sumando y testeando las diferentes partes del proyecto (enfoque modular de ingeniería).

* **Etapa 1 (Validación inicial):** [Ej: Configuración del oscilador/reloj y parpadeo de LED de estado].
* **Etapa 2 (Adquisición/Comunicación):** [Ej: Implementación del ADC y envío de tramas crudas por UART].
* **Etapa 3 (Integración lógica):** [Ej: Procesamiento de datos, lógica de control o montado sobre el RTOS].
* **Etapa 4 (Sistema Completo):** [Ej: Acople de actuadores finales, calibración y pruebas de estrés].

---

## 📊 5. Ensayos, Pruebas y Resultados (Común)
Demuestren con datos empíricos que el sistema funciona correctamente. **Es obligatorio incluir registro visual**.

* **Pruebas Funcionales Realizadas:** Detallen los ensayos (Ej: "Se inyectó una señal controlada para medir la precisión del ADC...").
* **Evidencia Fotográfica y Gráficos:** * *Capturas de instrumental:* [Insertar capturas de Osciloscopio, Analizador Lógico o Terminal Serie]
  * *Foto del Prototipo Real:* [Insertar foto del hardware final cableado/armado en funcionamiento]

---

## 📂 6. Estructura del Repositorio (Común)
El repositorio debe mantener obligatoriamente la siguiente estructura limpia (¡Recuerden configurar correctamente el `.gitignore` para no subir carpetas temporales como `Debug/`, `Release/` o archivos `.p1` / `.d`!).

```text
├── firmware/          # Código fuente del proyecto (MPLABX / MCUXpresso / STM32Cube)
│   ├── src/           # Archivos de código (.c)
│   └── inc/           # Archivos de cabecera (.h)
├── hardware/          # Archivos de diseño (KiCad/Altium), esquemáticos en PDF/Imagen y BOM
├── docs/              # Datasheets clave, imágenes del README, notas de aplicación
└── README.md          # Este archivo de presentación



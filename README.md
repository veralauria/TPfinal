
# Lampara patron modulada por PWM para verificar funcionamiento de sensor LDR
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
* Recibir los datos sensados y convertidos a digital en la PC mediante UART.
* Convertir los datos recibidos a porcentaje de iluminacion.
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

## 📐 2. Arquitectura del Sistema: Hardware y Software

### 🔌 Hardware & Interconexión
* **Diagrama de Bloques:** 
* **Esquemático del Circuito:**
 <img width="1600" height="1070" alt="image" src="https://github.com/user-attachments/assets/0d50c731-2800-4c24-bdcc-3e50f9ebe884" />

* **Descripción del Circuito y Consideraciones de Diseño:**
* El sistema se implementa sobre una protoboard y aparte una PCB que integra la lámpara de potencia y el sensor LDR, alojados dentro de una caja negra para minimizar la incidencia de luz externa y las reflexiones, garantizando condiciones de medición más controladas.

* El microcontrolador PIC16F887 se alimenta con +5 V y GND mediante una placa Arduino utilizada como fuente de alimentación.

* Se conecta un display de 7 segmentos al puerto D del PIC mediante resistencias de 220 Ω. La multiplexación de los tres dígitos se realiza desde el puerto A utilizando tres transistores NPN para su conmutación.

* El módulo UART se conecta a los pines RC6 (TX) y RC7 (RX). El sensor LDR se conecta a la entrada analógica AN0 (RA0), mientras que el pulsador se conecta al pin RB0 para generar una interrupción externa por flanco descendente.

* El oscilador externo de 4 MHz se conecta a los pines RA6 (OSC2) y RA7 (OSC1). El pin MCLR se polariza mediante una resistencia pull-up de 10 kΩ conectada a +5 V.

* El control de la lámpara de 12 V se realiza mediante un MOSFET de canal N. El pin RC2/CCP1 del PIC se conecta a través de una resistencia de 220 Ω a la compuerta (Gate) del MOSFET para aplicar la señal PWM. Tambien se conecta a la compuerta una resistencia pull-down de 10k ohms. El terminal Drain se conecta al negativo de la lámpara y el Source se conecta directamente a tierra. El terminal positivo de la lámpara se alimenta mediante una fuente externa de 12 V.

**Consideraciones de diseño:**  Para el conexionado de las señales y de la alimentación de baja corriente se utilizaron conductores sólidos individuales extraídos de un cable UTP y jumpers. En cambio, la alimentación de la lámpara LED de 12 V se realizó mediante un cable multifilar de mayor sección.

<img width="960" height="1280" alt="WhatsApp Image 2026-06-17 at 20 55 24" src="https://github.com/user-attachments/assets/570ad473-ae50-4e7a-9449-8eaeaaee774d" />

Imagen 1: Circuito en protoboard
<img width="1041" height="1280" alt="image" src="https://github.com/user-attachments/assets/6428cdef-92b3-419c-8ef8-73609a0f4110" />

Imagen 2: Circuito en PCB
  

### 💻 Arquitectura de Software (Firmware)
* **Diagrama de Flujo o Máquina de Estados:** *[Inserte aquí la imagen del diagrama que explique el lazo principal o el comportamiento del sistema]*
  `![Diagrama de Flujo / Máquina de Estados](docs/diagrama_software.png)`

---

## ⚡ 3. Especificaciones Eléctricas, Alimentación y Entorno 

### 🔌 Parámetros de Alimentación y Consumo 
* **Tensión de operación del sistema:** 5V por USB
* **Método de alimentación:**  Fuente externa de 12V 



### 📌 [OPCIÓN A: Solo para alumnos de Electrónica Digital II (PIC16F887)]
* **Herramientas de Software:** MPLAB X IDE [v5.35] 
* **Hardware de Programación/Depuración:** PICkit 3
* **Configuración de Bits (Fuses Críticos):**
  * *Oscilador:*  Cristal externo de 4 MHz
  * *Watchdog Timer (WDT):* OFF
  * *Master Clear (MCLRE):* ON (Pin externo con pull up) 
* **Periféricos Internos Utilizados:** Timer0, ADC, EUSART, PWM, Timer2
* **Gestión de Interrupciones:** Al contar con un único vector de interrupción, se le da prioridad a la interrupcion externa en la ISR, evaluando primero su bandera, INTF. Ya que si se presiono el pulsador, es necesario apagar la lampara inmediatamente, y luego actualizar el display, ya que el valor que se muestre no sera el mismo que antes del pulsador (debe ser 000).

---

## 🔄 4. Proceso de Integración y Desarrollo

* **Etapa 1 (Sensor):** Conexion del sensor y verificacion de su funcionamiento, observando los valores convertidos por el ADC en el display.
* **Etapa 2 (Transmicion correcta de datos):** Conexion de UART y control de los datos recibidos en la aplicacion web. 
* **Etapa 3 (Envio de datos por UART):** Conexion de un LED rojo a en CCP1 para verificar el funcionamiento correcto de PWM con los datos enviados mediante UART por la aplicacion web. Hasta este punto, no se utilizó fuente externa de 12 V.
* **Etapa 4 (Etapa de potencia):**  Conexion del MOSFET a CCP1 y lampara LED de potencia, utilizando fuente externa de 12 V, verificacion de su variacion en intensidad por PWM y correcto sensado del LDR.
* **Etapa 5 (Sistema completo):**  Implementacion de la caja con interior pintado de negro para eliminar las fuentes de luz que no sean la lampara de potencia y disminuir la reflexion en las superficies de la caja, para que no influya en el valor de intensidad sensado.
  

  

---

## 📊 5. Ensayos, Pruebas y Resultados

* **Pruebas Funcionales Realizadas:** Se vario el porcentaje del PWM y se observaron los cambios en el display y en la app web, verificando que sean iguales.
* **Evidencia Fotográfica y Gráficos:** 

<img width="1082" height="902" alt="image" src="https://github.com/user-attachments/assets/cf38ab47-f099-4503-89d9-307ad1e4c100" />
Imagen 3: Sistema en funcionamiento, datos recibidos en aplicacion web.
<img width="1206" height="1323" alt="image" src="https://github.com/user-attachments/assets/f6fc22e0-f618-43d0-94e8-6cad943ea91d" />
Imagen 4: Sistema en funcionamiento, circuito

El prototipo real (cableado) de la protoboard y la PCB se aprecia en las imagenes 1 y 2 respectivamente.



--


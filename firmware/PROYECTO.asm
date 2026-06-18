LIST	P=16F887
include<p16f887.inc>
    
     __CONFIG _CONFIG1, _XT_OSC & _WDT_OFF & _PWRTE_ON & _MCLRE_ON & _LVP_OFF 
    __CONFIG _CONFIG2, _BOR_ON
    
    ORG	0X00
    GOTO    INICIO
    
    ORG	0X04
    GOTO    ISR
    
    ORG	0X05
    INICIO
	
    BANKSEL ANSEL ;BANCO 3
    MOVLW   b'00000001'
    MOVWF   ANSEL  ;ENTRADA ANALOGICA PUERTO A
    
    BANKSEL ANSELH
    CLRF    ANSELH
 
    BANKSEL TRISA   
    MOVLW   b'00000001'
    MOVWF   TRISA ;ra0 entrada
    CLRF    TRISD;SEGMENTOS
    MOVLW   B'10000000' ; RC7 entrada RX, RC2 salida PWM, RC6 salida TX
    MOVWF   TRISC
    BANKSEL TRISB
    BSF TRISB,0
    
    BANKSEL PORTB
    CLRF    PORTD
    CLRF    PORTC
    CLRF    PORTA
    
    
    ;CONFIG TMR0
    BANKSEL OPTION_REG
    MOVLW   B'00000011' ;PS 16
    MOVWF   OPTION_REG
    
    BANKSEL WPUB
    BSF WPUB,0
    
    BANKSEL TMR0
    MOVLW   .6 ;PARA 4 MILI
    MOVWF   TMR0
    
   
    BANKSEL ADCON0
    MOVLW   B'01000001'
    MOVWF   ADCON0
    
    BANKSEL ADCON1
    CLRF    ADCON1
   
    BANKSEL PR2
    MOVLW   .249
    MOVWF   PR2

    BANKSEL CCP1CON
    MOVLW   B'00001100'     ; CCP1 modo PWM
    MOVWF   CCP1CON

    BANKSEL CCPR1L
    MOVLW   .125            ; duty inicial 50%
    MOVWF   CCPR1L     
    MOVWF PWM_GUARDADO

    BANKSEL TMR2
    CLRF    TMR2

    BANKSEL T2CON
    MOVLW   B'00000111'     ; Timer2 ON, prescaler 1:16
    MOVWF   T2CON
   
    
    BANKSEL TXSTA
    MOVLW   B'00100100'     ; BRGH=1, TXEN=1, modo asíncrono
    MOVWF   TXSTA

    BANKSEL RCSTA
    MOVLW   B'10010000'     ; SPEN=1, CREN=1
    MOVWF   RCSTA

    BANKSEL SPBRG
    MOVLW   .25             ; 9600 baudios con 4 MHz y BRGH=1
    MOVWF   SPBRG
    
   
    BANKSEL PORTA
   CBLOCK 0x20
    DISP1
    DISP2
    DISP3
    INDEX
    ADC_VAL
    ADC_DELAY
    RESTO_ADC
    CENT_ADC
    DEC_ADC
    UNI_ADC
    RX_CHAR
    RX_DIG
    RX_DECENA
    RX_ESTADO
    PWM_PCT
    PWM_TMP
    PWM_HALF
    PWM_GUARDADO
    PWM_BANDERA
    REB1
    REB2
    ENDC 
    
    CBLOCK 0x70
    W_TEMP
    STATUS_TEMP
ENDC

    BANKSEL DISP1 
    CLRF    DISP1
    CLRF    DISP2
    CLRF    DISP3
    CLRF    INDEX
    CLRF    RX_CHAR
    CLRF    RX_DIG
    CLRF    RX_DECENA
    CLRF    RX_ESTADO
    CLRF    PWM_PCT
    CLRF    PWM_TMP
    CLRF    PWM_HALF
    CLRF    PWM_BANDERA
    
    
    BANKSEL INTCON
    MOVLW   B'10110000'
    MOVWF   INTCON
    
BUCLE
    CALL    LEER_UART_PWM
    CALL    LEER_ADC
    CALL    ADC_A_DECIMAL
    CALL    ENVIAR_ADC_UART
    CALL    DELAY
    GOTO    BUCLE
    
TABLA_DISPLAY
    ADDWF	PCL,F	
    RETLW 0x3F ; 0 0011 1111
    RETLW 0x06 ; 1 0000 0110
    RETLW 0x5B ; 2 0101 1011
    RETLW 0x4F ; 3
    RETLW 0x66 ; 4
    RETLW 0x6D ; 5
    RETLW 0x7D ; 6
    RETLW 0x07 ; 7
    RETLW 0x7F ; 8
    RETLW 0x6F ; 9
    
DISPLAY_PRENDE
    ADDWF	PCL,F
    RETLW   B'00000010'
    RETLW   B'00000100'
    RETLW   B'00001000'
   
    
ISR
    ;2:GUARDO CONTEXTO
    BANKSEL W_TEMP
    MOVWF   W_TEMP 
    SWAPF   STATUS, W 
    MOVWF   STATUS_TEMP 
    
    ;3:QUIEN INTERRUMPIO
    BANKSEL INTCON
    BTFSC   INTCON, T0IF
    GOTO    DISPLAY
    BTFSS INTCON,INTF
    GOTO SALIR_ISR
    
;resuelvo rutina de int externa
INT_EXT
    
    BANKSEL INTCON
    BCF	    INTCON,INTE     ; deshabilito interrupción externa RB0
    BCF	    INTCON,INTF     ; limpio bandera

    CALL    DELAY_REBOTE   ; espero a que pase el rebote
    BANKSEL	PORTB 
    BTFSC PORTB,0
    GOTO SALIR_ISR
    
    BANKSEL PWM_BANDERA
    BTFSS PWM_BANDERA,0  ;1era oo 2da vez?
    
    GOTO APAGAR
    GOTO PRENDER
    
APAGAR    
    BSF PWM_BANDERA,0
    
    BANKSEL CCPR1L
    
    MOVF CCPR1L,W
    CLRF CCPR1L
    
    BANKSEL PWM_GUARDADO
    MOVWF PWM_GUARDADO
    
    GOTO SALIR_ISR
    
PRENDER
    
    BANKSEL PWM_BANDERA
    BCF PWM_BANDERA,0
    MOVF PWM_GUARDADO,W
    
    BANKSEL CCPR1L
    MOVWF CCPR1L
    
    GOTO SALIR_ISR
    
;4:RESUELVO RUTINA ASOCIADA AL TMR
DISPLAY
    BANKSEL INTCON
    BCF	    INTCON,T0IF
    
    BANKSEL TMR0
    MOVLW   .6
    MOVWF   TMR0
    
   BANKSEL  PORTD
    CLRF    PORTD
    CLRF    PORTA
    MOVLW   0X20
    ADDWF   INDEX,W
    MOVWF   FSR
    MOVF    INDF,W
    CALL    TABLA_DISPLAY
    MOVWF   PORTD   ;PRENDO SEGMENTOS
    
    ;AHORA SELECCIONAMOS EL DISPLAY
    MOVF    INDEX,W
    CALL    DISPLAY_PRENDE
    MOVWF   PORTA  
    
    
    INCF    INDEX,F
    MOVLW   .3
    XORWF   INDEX,W
    BTFSC   STATUS,Z
    CLRF    INDEX
    GOTO    SALIR_ISR
    
    
SALIR_ISR
    ;6:RECUPERO CONTEXTO
    SWAPF   STATUS_TEMP, W
    MOVWF   STATUS
    SWAPF   W_TEMP, F
    SWAPF   W_TEMP, W
 
    RETFIE
    
    
LEER_ADC
    CALL    DELAY_ADC

    BANKSEL ADCON0
    BSF     ADCON0,1        ; GO = 1, arranca conversión

ESPERA_ADC
    BTFSC   ADCON0,1        ; mientras GO siga en 1, espera
    GOTO    ESPERA_ADC

    BANKSEL ADRESH
    MOVF    ADRESH,W        ; leemos valor 0-255 aprox

    BANKSEL ADC_VAL
    MOVWF   ADC_VAL

    RETURN
    
      
    
ADC_A_DECIMAL
    BANKSEL ADC_VAL

    CLRF    CENT_ADC
    CLRF    DEC_ADC
    CLRF    UNI_ADC

    MOVF    ADC_VAL,W
    MOVWF   RESTO_ADC

CENTENAS
    MOVLW   .100
    SUBWF   RESTO_ADC,W
    BTFSS   STATUS,C
    GOTO    DECENAS

    MOVWF   RESTO_ADC
    INCF    CENT_ADC,F
    GOTO    CENTENAS

DECENAS
    MOVLW   .10
    SUBWF   RESTO_ADC,W
    BTFSS   STATUS,C
    GOTO    UNIDADES

    MOVWF   RESTO_ADC
    INCF    DEC_ADC,F
    GOTO    DECENAS

UNIDADES
    MOVF    RESTO_ADC,W
    MOVWF   UNI_ADC

    ; Copio resultado final a los displays
    ; Desactivo interrupciones un instante para que no lea valores a medio actualizar
    BANKSEL INTCON
    BCF     INTCON,GIE

    BANKSEL DISP1
    MOVF    CENT_ADC,W
    MOVWF   DISP1

    MOVF    DEC_ADC,W
    MOVWF   DISP2

    MOVF    UNI_ADC,W
    MOVWF   DISP3

    BANKSEL INTCON
    BSF     INTCON,GIE

    RETURN
    
ENVIAR_ADC_UART
    ; Envio letra L
    MOVLW   'L'
    CALL    UART_TX_CHAR

    ; Envio centena
    BANKSEL DISP1
    MOVF    DISP1,W
    ADDLW   0x30
    CALL    UART_TX_CHAR

    ; Envio decena
    BANKSEL DISP2
    MOVF    DISP2,W
    ADDLW   0x30
    CALL    UART_TX_CHAR

    ; Envio unidad
    BANKSEL DISP3
    MOVF    DISP3,W
    ADDLW   0x30
    CALL    UART_TX_CHAR

    ;envia nueva linea y enter (carriage return y line feed)
    MOVLW   0x0D   
    CALL    UART_TX_CHAR  
    MOVLW   0x0A   
    CALL    UART_TX_CHAR

    RETURN   
    
    
UART_TX_CHAR
    BANKSEL TXREG
    MOVWF   TXREG

ESPERA_TX
    BANKSEL PIR1
    BTFSS   PIR1,TXIF ;0=transmitiendo
    GOTO    ESPERA_TX

    RETURN
    
    
LEER_UART_PWM
    ; Si hubo overrun, reinicio recepción
    BANKSEL RCSTA
    BTFSS   RCSTA,OERR ;1 si overrun
    GOTO    CHECK_UART_RX

    BCF     RCSTA,CREN
    BSF     RCSTA,CREN
    RETURN

CHECK_UART_RX
    BANKSEL PIR1
    BTFSS   PIR1,RCIF
    RETURN

    BANKSEL RCREG
    MOVF    RCREG,W

    BANKSEL RX_CHAR
    MOVWF   RX_CHAR

    ; Convertir ASCII a número: RX_DIG = RX_CHAR - '0'
    MOVLW   0x30
    SUBWF   RX_CHAR,W
    BTFSS   STATUS,C
    GOTO    RESET_RX

    MOVWF   RX_DIG

    ; Si RX_DIG >= 10, no es número
    MOVLW   .10
    SUBWF   RX_DIG,W
    BTFSC   STATUS,C
    GOTO    RESET_RX

    ; Si RX_ESTADO = 0, guardo primer dígito
    MOVF    RX_ESTADO,W
    BTFSC   STATUS,Z
    GOTO    GUARDA_PRIMER_DIGITO

    ; Segundo dígito
    MOVF    RX_DECENA,W
    ADDWF   RX_DIG,W
    MOVWF   PWM_PCT

    CLRF    RX_ESTADO

    CALL    PORCENTAJE_A_PWM
    RETURN

GUARDA_PRIMER_DIGITO
    ; RX_DECENA = RX_DIG * 10
    CLRF    RX_DECENA

    MOVF    RX_DIG,W
    BTFSC   STATUS,Z
    GOTO    FIN_GUARDA_DECENA

MULT10_LOOP
    MOVLW   .10
    ADDWF   RX_DECENA,F

    DECF    RX_DIG,F
    MOVF    RX_DIG,W
    BTFSS   STATUS,Z
    GOTO    MULT10_LOOP

FIN_GUARDA_DECENA
    MOVLW   .1
    MOVWF   RX_ESTADO
    RETURN

RESET_RX
    CLRF    RX_ESTADO
    RETURN
     
      
PORCENTAJE_A_PWM
    BANKSEL PWM_PCT

    ; PWM_TMP = porcentaje * 2
    MOVF    PWM_PCT,W
    MOVWF   PWM_TMP

    BCF     STATUS,C
    RLF     PWM_TMP,F

    ; PWM_HALF = porcentaje / 2
    MOVF    PWM_PCT,W
    MOVWF   PWM_HALF

    BCF     STATUS,C
    RRF     PWM_HALF,F

    ; W = porcentaje*2 + porcentaje/2
    MOVF    PWM_HALF,W
    ADDWF   PWM_TMP,W

    BANKSEL CCPR1L
    MOVWF   CCPR1L
    MOVWF PWM_GUARDADO

    RETURN
    
      
    
DELAY_REBOTE  ;aprox 20ms 
    BANKSEL REB1
    MOVLW   .30
    MOVWF   REB1

REBOTE_1
    MOVLW   .200
    MOVWF   REB2

REBOTE_2
    DECFSZ  REB2,F
    GOTO    REBOTE_2

    DECFSZ  REB1,F
    GOTO    REBOTE_1

    RETURN    

      
    
    
DELAY ;5MILI
    

   MOVLW 255 
   MOVWF 0X35 
   
   cuenta_externa
   MOVLW 20
   MOVWF 0X36 
   
   cuenta_interna
   DECFSZ 0X36,F 
   GOTO cuenta_interna 
   
   DECFSZ 0X35,F 
   GOTO cuenta_externa
   
   RETURN
    
    
    
    
DELAY_ADC   ;90 MICROSEG para tiempo adquisicion
    BANKSEL ADC_DELAY
    MOVLW   .30
    MOVWF   ADC_DELAY

DADC
    DECFSZ  ADC_DELAY,F
    GOTO    DADC

    RETURN
END
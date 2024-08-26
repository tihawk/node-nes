import Compiler from "./Compiler";
const fs = require('fs');

// Example usage
const jsCode = `
{
  let a = 0;
}
// @zeropage
const entity = {
  // @.byte
  xpos: undefined
}
let appleH = 0x01;
let snakeHeadL = 0x10;
let snakeHeadH = 0x11;
let snakeBodyStart = 0x12;
let snakeDirection = 0x02;
let snakeLength = 0x03;

let movingUp    = 0b00000001;
let movingRight = 0b00000010;
let movingDown  = 0b00000100;
let movingLeft  = 0b00001000;

let ASCII_w = 0x77;
let ASCII_a = 0x61;
let ASCII_s = 0x73;
let ASCII_d = 0x64;

let sysRandom = 0xfe;
let sysLastKey = 0xff;

function initSnake() {
  snakeDirection = movingRight;
  snakeLength = 4;
  snakeHeadL = 0x11;
  snakeBodyStart = 0x10;

  /* what is this shit
  lda #$0f
  sta $14 ; body segment 1
  
  lda #$04
  sta snakeHeadH
  sta $13 ; body segment 1
  sta $15 ; body segment 2
  rts */
  return;
}

function generateApplePosition() {
  appleL = sysRandom;
  appleH = sysRandom & 0x03 + 2;
  return;
}

function init() {
  initSnake();
  generateApplePosition();
  return;
}

init();
`;

const nesAssemblyUtils = `
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; MULTIPLY routine
; Input:
;   MULTIPLICAND - holds the first operand
;   MULTIPLIER   - holds the second operand
; Output:
;   RESULT       - holds the result of MULTIPLICAND * MULTIPLIER

multiply:
    LDA #0
    STA RESULT           ; Clear RESULT
    STA MULTIPLY_COUNTER ; Initialize counter

multiply_loop:
    LDA MULTIPLIER       ; Load MULTIPLIER
    AND #01              ; Check if the least significant bit is set
    BEQ no_addition      ; If not, skip addition

    LDA MULTIPLICAND
    CLC
    ADC RESULT           ; Add MULTIPLICAND to RESULT
    STA RESULT

no_addition:
    LSR MULTIPLIER       ; Shift MULTIPLIER right (divide by 2)
    ASL MULTIPLICAND     ; Shift MULTIPLICAND left (multiply by 2)
    INC MULTIPLY_COUNTER
    LDA MULTIPLY_COUNTER
    CMP #8               ; Repeat 8 times (since we’re dealing with 8-bit numbers)
    BNE multiply_loop

    RTS                  ; Return from subroutine
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; DIVIDE routine
; Input:
;   DIVIDEND - holds the number to be divided
;   DIVISOR  - holds the number by which we divide
; Output:
;   QUOTIENT - holds the result of DIVIDEND / DIVISOR
;   REMAINDER - holds the remainder after division

divide:
    LDA #0
    STA QUOTIENT         ; Clear QUOTIENT
    STA REMAINDER        ; Clear REMAINDER

divide_loop:
    LDA DIVIDEND
    SEC
    SBC DIVISOR          ; Subtract DIVISOR from DIVIDEND
    BCC division_done    ; If the result is negative, division is done

    STA DIVIDEND
    INC QUOTIENT         ; Increment QUOTIENT
    JMP divide_loop      ; Repeat the loop

division_done:
    LDA DIVIDEND
    STA REMAINDER        ; Store the remainder in REMAINDER
    RTS                  ; Return from subroutine
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
`

const compiler = new Compiler();
let nesAssemblyCode = compiler.compile(jsCode);
console.log(nesAssemblyCode);

fs.writeFile('out.asm', nesAssemblyCode, (err: any) => {
  if (err) {
    console.error(err);
    return;
  }
})
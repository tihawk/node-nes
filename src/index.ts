import Compiler from "./Compiler";
const fs = require('fs');
const { exec } = require("child_process");

const argv = process.argv.slice(2);
const jsCode = fs.readFileSync(argv[0]).toString();

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

const handleExecReturn = (error: Error, stdout: string, stderr: string) => {
  if (error) {
      console.log(`error: ${error.message}`);
      return;
  }
  if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
  }
  console.log(`stdout: ${stdout}`);
}

exec('ca65 out.asm -o out.o --debug-info', (error: Error, stdout: string, stderr: string) => {
  handleExecReturn(error, stdout, stderr);
  exec('ld65 out.o -o out.nes -t nes --dbgfile out.dbg', handleExecReturn);
});
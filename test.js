// @char
let mario = "mario.chr"//, notMario = null; <- throws error, so good
{
  let a = 0;
}
// @zeropage
const entity = {
  // @.byte <- doesn't work, because of the tree-like structure of asts
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
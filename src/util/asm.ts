/* 
*  Hardcoded assembly code, mostly including the routines required by the 
*  VECTORS segment. Maybe later we can make these writable through decorators,
*  but for the time being, we can test our code by hardcoding them here.
*/

export const defaultZeropageSegment = [
  ["nmi_lock", 1],        // Prevents NMI re-entry
  ["nmi_count", 1],       // Is incremented every NMI
  ["nmi_ready", 1],       // Set to 1 to push a PPU frame update, 2 to turn rendering off next NMI
  ["nmt_update_len", 1],  // Number of bytes in nmt_update buffer
  ["scroll_x", 1],        // x scroll position
  ["scroll_y", 1],        // y scroll position
  ["scroll_nmt", 1],      // Nametable select (0-3 = $2000,$2400,$2800,$2C00)
  ["TEMP", 1],            // Temporary variable
]

export const defaultBssSegment = `
nmt_update: .res 256  ; Nametable update entry buffer for PPU update
palette:    .res 32   ; Palette buffer for PPU update
oam:        .res 256  ; Sprite OAM data to be uploaded by DMA

`

export const defaultVectorsSegment = `
.word nmi
.word reset
.word irq

`

export const reset = `
reset:
  sei       ; Mask interrupts
  lda #0
  sta $2000 ; Disable NMI
  sta $2001 ; Disable rendering
  sta $4015 ; Disable APU sound
  sta $4010 ; Disable DMC IRQ
  lda #$40
  sta $4017 ; Disable APU IRQ
  cld       ; Disable decimal mode
  ldx #$FF
  txs       ; Initialise stack
  ; Wait for first vblank
  bit $2002
  :
    bit $2002
    bpl :-
  ; Clear all RAM to 0
  lda #0
  ldx #0
  :
    sta $0000, X
    sta $0100, X
		sta $0200, X
		sta $0300, X
		sta $0400, X
		sta $0500, X
		sta $0600, X
		sta $0700, X
		inx
		bne :-
  ; Place all sprites offscreent at Y=255
  lda #255
  ldx #0
  :
    sta oam, X
    inx
    inx
    inx
    inx
    bne :-
  ; Wait for second vblank
  :
    bit $2002
    bpl :-
  ; NES is initalised, ready to begin!
  ; Enable the NMI for graphical updates, and jump to our main programme
  lda #%10001000
  sta $2000
  jmp main

`

export const nmi = `
nmi:
  ; Save registers
  pha
  txa
  pha
  tya
  pha
  ; Prevent NMI re-entry
  lda nmi_lock
  beq :+
    jmp @nmi_end
  :
    lda #1
    sta nmi_lock
    ; Increment frame counter
    inc nmi_count
    
    lda nmi_ready
    bne :+  ; nmi_ready == 0 -> not ready to update PPU
      jmp @ppu_update_end
    :
      cmp #2 ; nmit_ready == 2 -> turns rendering off
      bne :+
      lda #%00000000
      sta $2001
      ldx #0
      stx nmi_ready
      jmp @ppu_update_end
    :
      ; Sprite OAM DMA
      ldx #0
      stx $2003
      lda #>oam
      sta $4014
      ; Palettes
      lda #%10001000
      sta $2000       ; Set horizontal nametable increment
      lda $2002
      lda #$3f
      sta $2006
      stx $2006       ; Set PPU address to $3f00
      ldx #0
    :
      lda palette, X
      sta $2007
      inx
      cpx #32
      bcc :-
    ; Nametable update
    ldx #0
    cpx nmt_update_len
    bcs @scroll
    @nmt_update_loop:
      lda nmt_update, X
      sta $2006
      inx
      lda nmt_update, X
      sta $2006
      inx
      lda nmt_update, X
      sta $2007
      inx
      cpx nmt_update_len
      bcc @nmt_update_loop
    lda #0
  	sta nmt_update_len
  @scroll:
  	lda scroll_nmt
  	and #%00000011 ; keep only lowest 2 bits to prevent error
  	ora #%10001000
  	sta $2000
  	lda scroll_x
  	sta $2005
  	lda scroll_y
  	sta $2005
  	; enable rendering
  	lda #%00011110
  	sta $2001
  	; flag PPU update complete
  	ldx #0
  	stx nmi_ready
  @ppu_update_end:
  	; if this engine had music/sound, this would be a good place to play it
  	; unlock re-entry flag
  	lda #0
  	sta nmi_lock
  @nmi_end:
  	; restore registers and return
  	pla
  	tay
  	pla
  	tax
  	pla
  	rti

`

export const irq = `
irq:
  rti

`

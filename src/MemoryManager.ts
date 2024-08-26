// Memory Manager: Manages variable-to-memory location mapping
export default class MemoryManager {
  zeroPageMap: {
    [key: string]: string
  }
  reservedZeroPage
  memoryMap: {
    [key: string]: string
  }
  nextAddress
  constructor() {
    this.zeroPageMap = {}; // ZEROPAGE segment
    this.reservedZeroPage = 0;
    this.memoryMap = {};
    this.nextAddress = 0x0000; // Start of memory allocation
  }

  getMemoryLocation(variableName: string) {
    if (!this.memoryMap[variableName]) {
      this.memoryMap[variableName] = `$${this.nextAddress.toString(16)}`;
      this.nextAddress += 1; // Move to the next memory location
    }
    return this.memoryMap[variableName];
  }

  reserveZeroPageSpace(variableName: string, bytesToReserve: number = 1) {
    if (!this.zeroPageMap[variableName]) {
      if ((this.reservedZeroPage + bytesToReserve) > 255) {
        console.error("ZEROPAGE is full. Can't reserve more space");
        return;
      }
      this.zeroPageMap[variableName] = bytesToReserve.toString(10);
      this.reservedZeroPage += bytesToReserve; // Move to the next memory location
    }
    return this.zeroPageMap[variableName];
  }
}
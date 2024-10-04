// Memory Manager: Manages variable-to-memory location mapping
export default class MemoryManager {
  labelStore: String[]
  zeroPageMap: {
    [key: string]: string
  }
  reservedZeroPage
  memoryMap: {
    [key: string]: string
  }
  nextAddress
  constructor() {
    this.labelStore = [];
    this.zeroPageMap = {}; // ZEROPAGE segment
    this.reservedZeroPage = 0;
    this.memoryMap = {};
    this.nextAddress = 0x0000; // Start of memory allocation
  }

  getOrSetMemory(variableName: string) {
    if (this.labelStore.includes(variableName)) {
      // If the label store contains the variable name, it's been defined in
      // the code, so we can reference it simply by the label.
      return variableName;
    }
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
      this.labelStore.push(variableName);
    }
    return this.zeroPageMap[variableName];
  }

  storeLabel(variableName: string) {
    this.labelStore.push(variableName);
  }
}

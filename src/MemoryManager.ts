// Memory Manager: Manages variable-to-memory location mapping
export default class MemoryManager {
  memoryMap: {
    [key: string]: string
  }
  nextAddress
    constructor() {
        this.memoryMap = {};
        this.nextAddress = 0x0200; // Start of memory allocation
    }

    getMemoryLocation(variableName: string) {
        if (!this.memoryMap[variableName]) {
            this.memoryMap[variableName] = `$${this.nextAddress.toString(16)}`;
            this.nextAddress += 1; // Move to the next memory location
        }
        return this.memoryMap[variableName];
    }
}
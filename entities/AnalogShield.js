'use strict';

var OUTPUT_1_10V_REGISTERS = [0, 1, 2, 3, 4];

class AnalogShield {
  constructor(modbusMaster, modbusAddr) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;
  }

  /**
   * Set value for 1-10 output port
   * @param adr port address
   * @param value 0-255
   */
  setAnalogOutput(adr, value) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, OUTPUT_1_10V_REGISTERS[adr], value, 100);
  }
}

module.exports = AnalogShield;

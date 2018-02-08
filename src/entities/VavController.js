'use strict';

const DUMPER_REGISTERS = [0, 1, 2];
const EXHAUST_FAN_REG = 5;
const INTAKE_FAN_REG = 6;

class VavController {
  /**
   *
   * @param {ModbusMaster} modbusMaster
   * @param {number} modbusAddr
     */
  constructor(modbusMaster, modbusAddr) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;
    this.intakeFanEnabled = false;
    this.exhaustFanEnabled = false;
  }

  /**
   * Set value for 1-10 output port
   * @param adr port address
   * @param value 0-100
   */
  setDumperPosition(adr, value) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, DUMPER_REGISTERS[adr], value, 10);
  }

  /**
   *
   * @param {boolean} value
     */
  changeIntakeFanStatus(value) {
    this.intakeFanEnabled = value;
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, INTAKE_FAN_REG, value ? 1 : 0, 10);
  }

  /**
   *
   * @param {boolean} value
   */
  changeExhaustFanStatus(value) {
    this.exhaustFanEnabled = value;
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, EXHAUST_FAN_REG, value ? 1 : 0, 10);
  }
}

module.exports = VavController;

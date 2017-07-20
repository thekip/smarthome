'use strict';

const SimpleEvent = require('../libs/simple-event');
const _ = require('lodash');
const log = require('../libs/log');
const ModbusCrcError = require('modbus-rtu/errors').crc;
const TimeoutError = require('bluebird').TimeoutError;

const REGISTERS = {
  ENABLED: 0,
  UNIT_MODE: 1,
  FAN_SPEED: 2,
  TEMP_SETPOINT: 4,
  AMBIENT_TEMP_AC_UNIT: 5,
  AMBIENT_TEMP_EXTERNAL: 22,
  AC_ACTUAL_SETPOINT_TEMP: 23,
};

const AMBIENT_TEMP_DEFAULT = -32768;

const MODES = {
  AUTO: 0,
  HEAT: 1,
  DRY: 2,
  FAN: 3,
  COOL: 4,
};

class AcUnit {
  constructor(modbusMaster, modbusAddr) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;

    this.enabled = false;
    this.mode = null;
    this.fanSpeed = null;
    this.tempSetpoint = null;
    this.ambientTemp = null;

    // refer to documentation http://www.intesis.com/pdf/IntesisBox_ME_AC_MBS_1_manual_eng.pdf  p3.2.4
    this.$ambientTempAcUnit = null;
    this.$actualSetpoint = null;

    this._debouncedWrite = _.debounce(this._write.bind(this));
    this.onChange = new SimpleEvent();
  }

  update() {
    return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 24).then((data) => {
      this.enabled = !!data[REGISTERS.ENABLED];
      this.mode = data[REGISTERS.UNIT_MODE];
      this.fanSpeed = data[REGISTERS.FAN_SPEED];
      this.tempSetpoint = data[REGISTERS.TEMP_SETPOINT];
      this.ambientTemp = data[REGISTERS.AMBIENT_TEMP_EXTERNAL];

      this.$actualSetpoint = data[REGISTERS.AC_ACTUAL_SETPOINT_TEMP];
      this.$ambientTempAcUnit = data[REGISTERS.AMBIENT_TEMP_AC_UNIT];
    }).catch(ModbusCrcError, TimeoutError, () => {
      // do nothing
    });
  }

  setTempSetpoint(setpoint) {
    if ((+this.tempSetpoint) === (+setpoint)) {
      return;
    }
    this.tempSetpoint = setpoint;
    return this._debouncedWrite(REGISTERS.TEMP_SETPOINT, setpoint);
  }

  resetControls() {
    this.setDefaultAmbientTemp();
  }

  setAmbientTemp(temp) {
    if (this.ambientTemp === temp) {
      return;
    }
    this.ambientTemp = temp;
    return this._debouncedWrite(REGISTERS.AMBIENT_TEMP_EXTERNAL, temp);
  }

  setDefaultAmbientTemp() {
    return this.setAmbientTemp(AMBIENT_TEMP_DEFAULT);
  }

  setEnabled(value) {
    if (this.enabled === value) {
      return;
    }
    this.enabled = value;
    log.info('Enable AC Unit: ', value);
    return this._debouncedWrite(REGISTERS.ENABLED, +value);
  }

  toString() {
    return 'Status: ' + (this.enabled ? 'on' : 'off ') +
      '; Ambient temp: ' + this.ambientTemp + 'C; Setpoint: ' + this.tempSetpoint + 'C; \n\r' +
      'Real AC ambient temp: ' + this.$ambientTempAcUnit + 'C; Real AC setpoint: ' + this.$actualSetpoint + 'C;';
  }

  _write(reg, value) {
    this.onChange.trigger();
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, reg, value);
  }

  getDto() {
    return _.pick(this, ['enabled', 'mode', 'fanSpeed', 'tempSetpoint', 'ambientTemp']);
  }
}

module.exports = AcUnit;
module.exports.MODES = MODES;
module.exports.REGISTERS = REGISTERS;

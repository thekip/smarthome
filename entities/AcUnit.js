'use strict';

const SimpleEvent = require('../libs/simple-event');
const ModbusCrcError = require('../modbus-rtu/errors').crc;
const TimeoutError = require('bluebird').TimeoutError;

//registers
const ENABLED_REGISTER = 0,
    UNIT_MODE_REGISTER = 1,
    FAN_SPEED_REGISTER = 2,
    TEMP_SETPOINT_REGISTER = 4,
    AMBIENT_TEMP_AC_UNIT_REGISTER = 5,
    AMBIENT_TEMP_EXTERNAL_REGISTER = 22,
    AC_ACTUAL_SETPOINT_TEMP = 23

const AMBIENT_TEMP_DEFAULT = -32768;

class AcUnit {
  constructor(modbusMaster, modbusAddr) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;

    this.enabled = false;
    this.unitMode = null;
    this.fanSpeed = null;
    this.tempSetpoint = null;
    this.ambientTemp = null;

    //refer to documentation http://www.intesis.com/pdf/IntesisBox_ME_AC_MBS_1_manual_eng.pdf  p3.2.4
    this.$ambientTempAcUnit = null;
    this.$actualSetpoint = null;

    this.MODES = {
      AUTO: 0,
      HEAT: 1,
      DRY: 2,
      FAN: 3,
      COOL: 4
    };

    this.onChange = new SimpleEvent();
  }

  update() {
    return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 24).then((data) => {
      this.enabled = data[ENABLED_REGISTER];
      this.unitMode = data[UNIT_MODE_REGISTER];
      this.fanSpeed = data[FAN_SPEED_REGISTER];
      this.tempSetpoint = data[TEMP_SETPOINT_REGISTER];
      this.ambientTemp = data[AMBIENT_TEMP_EXTERNAL_REGISTER];

      this.$actualSetpoint = data[AC_ACTUAL_SETPOINT_TEMP];
      this.$ambientTempAcUnit = data[AMBIENT_TEMP_AC_UNIT_REGISTER]
    }).catch(ModbusCrcError, TimeoutError, (err) => {
      //do nothing
    })
  }


  setTempSetpoint(setpoint) {
    if (setpoint == setpoint) {
      return;
    }
    this.tempSetpoint = setpoint;
    return this._write(TEMP_SETPOINT_REGISTER, setpoint);
  }

  resetControls() {
    this.setDefaultAmbientTemp();
  }

  setAmbientTemp(temp) {
    if (this.ambientTemp == temp) {
      return;
    }
    this.ambientTemp = temp;
    return this._write(AMBIENT_TEMP_EXTERNAL_REGISTER, temp);
  }

  setDefaultAmbientTemp() {
    return this.setAmbientTemp(AMBIENT_TEMP_DEFAULT);
  }

  setEnabled(value) {
    if (this.enabled == value) {
      return;
    }
    this.enabled = value;
    console.log('Enable AC Unit: ', value);
    return this._write(ENABLED_REGISTER, + value);
  }

  toString() {
    return 'Status: ' + (this.enabled ? 'on' : 'off ') +
      '; Set room temp: ' + this.ambientTemp + 'C; Set setpoint: ' + this.tempSetpoint + 'C; \n\r' +
      'Real AC ambient temp: ' + this.$ambientTempAcUnit + 'C; Real AC setpoint: ' + this.$actualSetpoint + 'C;'
  }

  _write(reg, value) {
    this.onChange.trigger();
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, reg, value);
  }

  watch() {
    this.update().then((rawData) => {
      //if (rawData && !_.isEqual(this._currentData, rawData)) {
      //  // check, whether data is changed or not
      //  this.onChange.trigger();
      //}
    }).catch((err) => {
      console.log('ac error', err);
    }).finally(() => {
      setTimeout(() => {
        this.watch();
      }, 300)
    });
  }
}

module.exports = AcUnit;

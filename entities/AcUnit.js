'use strict';

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
    }
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
    })
  }

  setTempSetpoint(setpoint) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, TEMP_SETPOINT_REGISTER, setpoint)
  }

  resetControls() {
    this.setDefaultAmbientTemp();
  }

  setAmbientTemp(temp) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, AMBIENT_TEMP_EXTERNAL_REGISTER, temp)
  }

  setDefaultAmbientTemp(temp) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, AMBIENT_TEMP_EXTERNAL_REGISTER, AMBIENT_TEMP_DEFAULT)
  }

  setEnabled(value) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, ENABLED_REGISTER, + value)
  }

  toString() {
    return 'Status: ' + (this.enabled ? 'on' : 'off ') +
      '; Set room temp: ' + this.ambientTemp + 'C; Set setpoint: ' + this.tempSetpoint + 'C; \n\r' +
      'Real AC ambient temp: ' + this.$ambientTempAcUnit + 'C; Real AC setpoint: ' + this.$actualSetpoint + 'C;'
  }

  enable() {
    return this.setEnabled(1).then(() => {
      return this.update();
    });
  }

  disable() {
    return this.setEnabled(0).then(() => {
      return this.update();
    });
  }
}

module.exports = AcUnit;

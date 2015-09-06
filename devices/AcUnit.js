/**
 * Created by 1 on 11.08.2015.
 */
module.exports = AcUnit;

//registers
var ENABLED_REGISTER = 0,
    UNIT_MODE_REGISTER = 1,
    FAN_SPEED_REGISTER = 2,
    TEMP_SETPOINT_REGISTER = 4,
    AMBIENT_TEMP_AC_UNIT_REGISTER = 5,
    AMBIENT_TEMP_EXTERNAL_REGISTER = 22,
    AC_ACTUAL_SETPOINT_TEMP = 23

var AMBIENT_TEMP_DEFAULT = -32768;

function AcUnit(modbusMaster, modbusAddr) {
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

AcUnit.prototype.update = function () {
    var ac = this;
    return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 24).then(function (data) {
        ac.enabled = data[ENABLED_REGISTER];
        ac.unitMode = data[UNIT_MODE_REGISTER];
        ac.fanSpeed = data[FAN_SPEED_REGISTER];
        ac.tempSetpoint = data[TEMP_SETPOINT_REGISTER];
        ac.ambientTemp = data[AMBIENT_TEMP_EXTERNAL_REGISTER];

        ac.$actualSetpoint = data[AC_ACTUAL_SETPOINT_TEMP];
        ac.$ambientTempAcUnit = data[AMBIENT_TEMP_AC_UNIT_REGISTER]
    })
}

AcUnit.prototype.setTempSetpoint = function (setpoint) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, TEMP_SETPOINT_REGISTER, setpoint)
}

AcUnit.prototype.setAmbientTemp = function (temp) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, AMBIENT_TEMP_EXTERNAL_REGISTER, temp)
}

AcUnit.prototype.setDefaultAmbientTemp = function (temp) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, AMBIENT_TEMP_EXTERNAL_REGISTER, AMBIENT_TEMP_DEFAULT)
}

AcUnit.prototype.setEnabled = function (value) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, ENABLED_REGISTER, +value)
}

AcUnit.prototype.toString = function () {
    return 'Status: ' + (this.enabled ? 'on' : 'off ') +
        '; Set room temp: ' + this.ambientTemp + 'C; Set setpoint: ' + this.tempSetpoint + 'C; \n\r' +
            'Real AC ambient temp: ' + this.$ambientTempAcUnit + 'C; Real AC setpoint: ' + this.$actualSetpoint + 'C;'
}

AcUnit.prototype.enable = function () {
    var ac = this;
    return this.setEnabled(1).then(function(){
        return ac.update();
    });
}

AcUnit.prototype.disable = function () {
    var ac = this;
    return this.setEnabled(0).then(function(){
        return ac.update();
    });
}

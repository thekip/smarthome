'use strict';

const _ = require('lodash');
const MicroEvent = require('microevent');

const ModbusCrcError = require('modbus-rtu/errors').crc;
const TimeoutError = require('bluebird').TimeoutError;

const ENABLED_REGISTER = 0,
  FAN_SPEED_REGISTER = 1,
  MODE_REGISTER = 2,
  ROOM_TEMP_REGISTER = 3,
  TEMP_SETPOINT_REGISTER = 4,
  MANUAL_WEEKLY_PROG_REGISTER = 5,

  MINUTE_SECOND_REGISTER = 6,
  WEEK_HOUR_REGISTER = 7;

const ENABLED_VALUE = 165,
  DISABLED_VALUE = 90;

class Thermostat {
  constructor(modbusMaster, modbusAddr, noWatch) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;

    this.enabled = false;
    this.fanSpeed = null;
    this.mode = null;
    this.roomTemp = null;
    this.tempSetpoint = null;
    this.isWeeklyProgram = null;

    this._rawData = [];
    this._currentData = [];

    if (!noWatch)
      this.watch();
  }

  update() {
    return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 6).then((data) => {
      this._rawData = data;

      this.enabled = data[ENABLED_REGISTER] != DISABLED_VALUE;
      this.fanSpeed = data[FAN_SPEED_REGISTER];
      this.mode = data[MODE_REGISTER];
      this.roomTemp = data[ROOM_TEMP_REGISTER] / 2;
      this.tempSetpoint = data[TEMP_SETPOINT_REGISTER] / 2;
      this.isWeeklyProgram = data[MANUAL_WEEKLY_PROG_REGISTER];
    })
  }

  toString() {
    return 'Status: ' + (this.enabled ? 'on' : 'off') +
      '; Room temp: ' + this.roomTemp + 'C; Set temp: ' + this.tempSetpoint + 'C;'
  }

  /**
   *
   * @param {boolean} value
   */
  setEnable(value) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, 9, !value ? DISABLED_VALUE : ENABLED_VALUE).then(() => {
      this.enabled = !!value;
      this._currentData[ENABLED_REGISTER] = !value ? DISABLED_VALUE : ENABLED_VALUE;
    });
  }

  enable() {
    return this.setEnable(true);
  }

  disable() {
    return this.setEnable(false);
  }

  setTempSetpoint(temp) {
    return this._modbusMaster.writeSingleRegister(this._modbusAddr, 13, temp * 2).then(() => {
      this.tempSetpoint = temp;
      this._currentData[TEMP_SETPOINT_REGISTER] = temp * 2;
    });
  }

  watch() {
    this.update().then(() => {
      if (this._currentData.length == 0 && this._rawData.length !== 0) {
        this.trigger('ready', this);
      }

      if (!_.isEqual(this._currentData, this._rawData)) {
        this.trigger('change', this);
      }

      this._currentData = this._rawData.slice(0); //clone data array
    }).catch(ModbusCrcError, TimeoutError, (err) => {
      //do nothing
    }).finally(() => {
      setTimeout(() => {
        this.watch();
      }, 300)
    });
  }
}

MicroEvent.mixin(Thermostat);
module.exports = Thermostat;

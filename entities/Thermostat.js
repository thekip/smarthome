'use strict';

const _ = require('lodash');
const SimpleEvent = require('../libs/simple-event');
const DeviceConnection = require('../libs/device-connection');

const ModbusCrcError = require('../modbus-rtu/errors').crc;
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
  /**
   *
   * @param {Master} modbusMaster
   * @param {Number} modbusAddr
   * @param {boolean} noWatch
     */
  constructor(modbusMaster, modbusAddr, noWatch) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;

    this.enabled = false;
    this.fanSpeed = null;
    this.mode = null;
    this.roomTemp = null;
    this.tempSetpoint = null;
    this.isWeeklyProgram = null;

    this._currentData = [];

    /**
     *
     * @type {SimpleEvent}
     */
    this.onChange = new SimpleEvent();

    this.connection  = new DeviceConnection();

    this.connection.onConnectionLost.bind((err)=> {
      console.error('Lost connection to thermostat ' + this._modbusAddr, err);
    });

    this.connection.onConnectionRestore.bind(()=> {
      console.error('Connection restored. Thermostat ' + this._modbusAddr);
    });

    noWatch ? this.update() :  this.watch();
  }

  update() {
    return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 6).then((data) => {
      this.connection.success();

      if (this._modbusAddr == 10) {
        console.log('Thermostat', this._modbusAddr, data[ROOM_TEMP_REGISTER] / 2);
      }

      this.enabled = data[ENABLED_REGISTER] != DISABLED_VALUE;
      this.fanSpeed = data[FAN_SPEED_REGISTER];
      this.mode = data[MODE_REGISTER];
      this.roomTemp = data[ROOM_TEMP_REGISTER] / 2;
      this.tempSetpoint = data[TEMP_SETPOINT_REGISTER] / 2;
      this.isWeeklyProgram = data[MANUAL_WEEKLY_PROG_REGISTER];

      return data;
    }).catch(ModbusCrcError, TimeoutError, (err) => {
      this.connection.error(err);
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
    this.update().then((rawData) => {
      if (!rawData || !rawData.length) {
        return;
      }

      if (this._currentData.length == 0) {
        // filled first time
        this.onChange.trigger();
      }

      if (!_.isEqual(this._currentData, rawData)) {
        // check, whether data is changed or not
        this.onChange.trigger();
      }

      this._currentData = rawData.slice(0); //clone data array
    }).finally(() => {
      setTimeout(() => {
        this.watch();
      }, 300)
    });
  }
}

module.exports = Thermostat;

'use strict';

const SimpleEvent = require('../libs/simple-event');
const DeviceConnection = require('../libs/device-connection');
const log = require('../libs/log');

const ModbusCrcError = require('modbus-rtu/errors').crc;
const TimeoutError = require('bluebird').TimeoutError;

const DEFAULT_SETPOINT = 24;

const REGISTERS = {
  ENABLED: 0,
  FAN_SPEED: 1,
  MODE: 2,
  ROOM_TEMP: 3,
  TEMP_SETPOINT: 4,
  MANUAL_WEEKLY_PROG: 5,

  MINUTE_SECOND: 6,
  WEEK_HOUR: 7,
};

const ENABLED_VALUE = 165;
const DISABLED_VALUE = 90;

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
    this.roomTemp = null;
    this.tempSetpoint = DEFAULT_SETPOINT;

    this._currentData = [];

    /**
     * Emits only if hardware data changed
     * @type {SimpleEvent}
     */
    this.onChange = new SimpleEvent();

    this.connection = new DeviceConnection();

    this.connection.onConnectionLost.bind((err) => {
      log.error('Lost connection to thermostat ' + this._modbusAddr, err);
    });

    this.connection.onConnectionRestore.bind(() => {
      log.error('Connection restored. Thermostat ' + this._modbusAddr);
    });

    if (!noWatch) {
      this.watch();
    }
  }

  update() {
    return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 6).then((data) => {
      this.connection.success();

      this.roomTemp = data[REGISTERS.ROOM_TEMP] / 2;
      if (this._currentData[REGISTERS.ROOM_TEMP] !== data[REGISTERS.ROOM_TEMP]) { // check, whether data is changed or not
        this.onChange.trigger();
      }

      this._currentData = data.slice(0); // clone data array

      return data;
    }).catch(ModbusCrcError, TimeoutError, (err) => {
      this.connection.error(err);
    });
  }

  toString() {
    return `Room temp: ${this.roomTemp} C;`;
  }

  /**
   *
   * @param {boolean} value
   */
  setEnable(value) {
    this.enabled = !!value;
    this._currentData[REGISTERS.ENABLED] = !value ? DISABLED_VALUE : ENABLED_VALUE;
  }

  enable() {
    return this.setEnable(true);
  }

  disable() {
    return this.setEnable(false);
  }

  setTempSetpoint(temp) {
    this.tempSetpoint = temp;
    this._currentData[REGISTERS.TEMP_SETPOINT] = temp * 2;
  }

  watch() {
    this.update().finally(() => {
      setTimeout(() => {
        this.watch();
      }, 300);
    });
  }
}

module.exports = Thermostat;
module.exports.REGISTERS = REGISTERS;
module.exports.DEFAULT_SETPOINT = DEFAULT_SETPOINT;

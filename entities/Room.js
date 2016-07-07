'use strict';

const _ = require('lodash');
const SimpleEvent = require('../libs/simple-event');

let id = 0;

class Room {
  /**
   *
   * @param {Thermostat} thermostat
   * @param {Dumper} dumper
   * @param {AcUnit} ac
     */
  constructor(thermostat, dumper, ac) {
    /**
     *
     * @type {SimpleEvent}
     */
    this.onChange = new SimpleEvent();

    this._thermostat = thermostat;
    this._dumper = dumper;
    this._ac = ac;
    this.id = id++;
    this.sync = null;

    thermostat.onChange.bind(() => {
      this.onThermostatChange();
    });
  }

  onThermostatChange() {
    this._enabled = this._thermostat.enabled;
    this._tempSetpoint = this._thermostat.tempSetpoint;

    console.log("Room: thermostat changed! " + this.id + ": " + this._thermostat.toString());

    this.onChange.trigger({
      emitter: 'thermostat'
    });
    this._updateDumperPosition();
  }

  _updateDumperPosition() {
    //let position = 'close';

    var position = !this.enabled ? 'close' : 'open';
    //if (this.enabled && this._ac.mode === this._ac.MODES.COOL) {
    //    position = (this.ambientTemp - this.tempSetpoint) <= 0 ? 'close' : 'open'
    //}
    //
    //if (this.enabled && this._ac.mode === this._ac.MODES.HEAT) {
    //    position = (this.tempSetpoint - this.ambientTemp) <= 0 ? 'close' : 'open'
    //}

    this._dumper[position]()
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    if (this._enabled === value) {
      return;
    }

    this._enabled = !!value;
    this._thermostat.setEnable(value);

    this.onChange.trigger({
      emitter: 'program'
    });

    this._updateDumperPosition();
  }

  get ambientTemp() {
    return this._thermostat.roomTemp;
  }

  get tempSetpoint() {
    return this._thermostat.tempSetpoint;
  }

  set tempSetpoint(temp) {
    if (this.tempSetpoint === temp) {
      return;
    }

    this._thermostat.setTempSetpoint(temp);

    this.onChange.trigger({
      emitter: 'program'
    });

    this._updateDumperPosition();
  }

  getDto() {
    const dto = {};

    _.each(['tempSetpoint', 'enabled', 'ambientTemp', 'sync', 'id'], (prop) => {
      dto[prop] = this[prop];
    });

    return dto;
  }
}

module.exports = Room;

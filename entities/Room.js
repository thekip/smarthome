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
    this.ambientTemp = null;
    this._tempSetpoint = null;
    this.sync = null;

    thermostat.onChange.bind(() => {
      this.onThermostatChange();
    });
  }

  onThermostatChange() {
    this._enabled = this._thermostat.enabled;
    this.ambientTemp = this._thermostat.roomTemp;
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

  get tempSetpoint() {
    return this._tempSetpoint;
  }

  set tempSetpoint(temp) {
    if (this._tempSetpoint === temp) {
      return;
    }

    this._tempSetpoint = temp;
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

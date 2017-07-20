'use strict';

const _ = require('lodash');
const hysteresis = require('../libs/hysteresis');
const SimpleEvent = require('../libs/simple-event');
const AC_MODES = require('./AcUnit').MODES;
const log = require('../libs/log');

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
    this.dumper = dumper;
    this._ac = ac;
    this.id = id++;
    this.sync = null;

    thermostat.onChange.bind(() => {
      this._onThermostatChange();
    });

    this._memoizedHysteresis = _.memoize(hysteresis, () => {
      // create new hysteresis only if this fields is change
      return this.tempSetpoint + this.enabled + this._ac.mode;
    });
  }

  _onThermostatChange() {
    log.info('Room: thermostat is changed! ' + this.id + ': ' + this._thermostat.toString());

    this.onChange.trigger({
      emitter: 'thermostat',
    });
  }

  updateDumperPosition() {
    if (!this.enabled) {
      return this.dumper.close();
    }

    let position = 'close';

    if (this._ac.mode === AC_MODES.COOL) {
      position = (this.ambientTemp - this.tempSetpoint) <= 0 ? 'close' : 'open';
    }

    if (this._ac.mode === AC_MODES.HEAT) {
      position = (this.tempSetpoint - this.ambientTemp) <= 0 ? 'close' : 'open';
    }

    this.dumper[position]();
  }

  get enabled() {
    return this._thermostat.enabled;
  }

  set enabled(value) {
    if (this.enabled === value) {
      return;
    }

    this._thermostat.setEnable(value);

    this.onChange.trigger({
      emitter: 'program',
    });
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
      emitter: 'program',
    });
  }

  getDto() {
    const dto = _.pick(this, ['tempSetpoint', 'enabled', 'ambientTemp', 'sync', 'id']);
    dto.dumperOpened = this.dumper.isOpened;
    return dto;
  }
}

module.exports = Room;

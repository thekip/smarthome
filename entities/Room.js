'use strict';

const _ = require('lodash');
const MicroEvent = require('microevent');

let id = 0;

class Room {
  constructor(thermostat, dumper, ac) {
    this._thermostat = thermostat;
    this._dumper = dumper;
    this._ac = ac;
    this.id = id++;
    this.enabled = false;
    this.ambientTemp = null;
    this.tempSetpoint = null;

    thermostat.bind('change', () => {
      this.onThermostatChange();
    });
  }

  onThermostatChange() {
    this.enabled = this._thermostat.enabled;
    this.ambientTemp = this._thermostat.roomTemp;
    this.tempSetpoint = this._thermostat.tempSetpoint;

    console.log("Room: thermostat changed! " + this.id + ": " + this._thermostat.toString());

    this.trigger('change');
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

  setEnable(value) {
    this.enabled = !!value;
    this._thermostat.setEnable(value);
    this.trigger('change');
    this._updateDumperPosition();
  }

  setTempSetpoint(temp) {
    this.tempSetpoint = temp;
    this._thermostat.setTempSetpoint(temp);
    this.trigger('change');
    this._updateDumperPosition();
  }
}

MicroEvent.mixin(Room);
module.exports = Room;

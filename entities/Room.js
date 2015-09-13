var _ = require('lodash');
var MicroEvent  = require('microevent');
var moment = require('moment');

module.exports = Room;

function Room(thermostat, dumper, ac) {

    this.thermostat = thermostat;
    this.dumper = dumper;
    this.ac = ac;

    this.enabled = false;
    this.ambientTemp = null;
    this.tempSetpoint = null;

    var self = this;

    thermostat.bind('change', function(){
        self.onThermostatChange();
    });
}

MicroEvent.mixin(Room);

_.extend(Room.prototype, {
   onThermostatChange: function(){
       this.enabled = this.thermostat.enabled;
       this.ambientTemp = this.thermostat.roomTemp;
       this.tempSetpoint = this.thermostat.tempSetpoint;

       this.trigger('change');
       this._updateDumperPosition();
   },
    _updateDumperPosition: function(){
        var position = 'close';

        if (this.enabled && this.ac.mode === this.ac.MODES.COOL) {
            position = this.ambientTemp - this.tempSetpoint <= 0 ? 'close' : 'open'
        }

        if (this.enabled && this.ac.mode === this.ac.MODES.HEAT) {
            position = this.ambientTemp - this.tempSetpoint >= 0 ? 'close' : 'open'
        }

        this.dumper[position]()
    },

    setEnable: function(value) {
        this.enabled = !!value;
        this.thermostat.setEnable(value);
        this.trigger('change');
        this._updateDumperPosition();
    },

    setTempSetpoint: function(temp) {
        this.tempSetpoint = temp;
        this.thermostat.setTempSetpoint(temp);
        this.trigger('change');
        this._updateDumperPosition();
    },
});


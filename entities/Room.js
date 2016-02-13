var _ = require('lodash');
var MicroEvent  = require('microevent');
var moment = require('moment');

module.exports = Room;
var id = 0;

function Room(thermostat, dumper, ac) {

    this._thermostat = thermostat;
    this._dumper = dumper;
    this._ac = ac;
    this.id = id++;
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
       this.enabled = this._thermostat.enabled;
       this.ambientTemp = this._thermostat.roomTemp;
       this.tempSetpoint = this._thermostat.tempSetpoint;

       console.log("Room: thermostat changed! " + this.id + ": " + this._thermostat.toString());

       this.trigger('change');
       this._updateDumperPosition();
   },
    _updateDumperPosition: function(){
        //var position = 'close';

        var position = !this.enabled ? 'close' : 'open';
        //if (this.enabled && this._ac.mode === this._ac.MODES.COOL) {
        //    position = (this.ambientTemp - this.tempSetpoint) <= 0 ? 'close' : 'open'
        //}
        //
        //if (this.enabled && this._ac.mode === this._ac.MODES.HEAT) {
        //    position = (this.tempSetpoint - this.ambientTemp) <= 0 ? 'close' : 'open'
        //}


        this._dumper[position]()
    },

    setEnable: function(value) {
        this.enabled = !!value;
        this._thermostat.setEnable(value);
        this.trigger('change');
        this._updateDumperPosition();
    },

    setTempSetpoint: function(temp) {
        this.tempSetpoint = temp;
        this._thermostat.setTempSetpoint(temp);
        this.trigger('change');
        this._updateDumperPosition();
    },
});


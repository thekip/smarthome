var _ = require('lodash');
//var MicroEvent = require('microevent');

module.exports = Dumper;

var OUTPUT_1_10V_REGISTERS = [0, 1, 2, 3, 4];

var FULL_CLOSED = 255;
var FULL_OPENED = 0;

function Dumper(_port, AnalogShield) {
    this._position = null;
    this._analogShield = AnalogShield;
    this._port = _port;
}

//MicroEvent.mixin(Dumper);

_.extend(Dumper.prototype, {

    isClosed: function(){
        return this._position >= FULL_CLOSED;
    },

    isOpened: function(){
        return this._position == FULL_OPENED;
    },

    close: function(){
        this.setPosition(100);
    },

    open: function(){
        this.setPosition(0);
    },

    /**
     * Set dumper position in percent. 100% is fully closed
     * @param percent
     */
    setPosition: function(percent) {
        this._position = Math.round(FULL_CLOSED * percent / 100);
        this._analogShield.setAnalogOutput(this._port, this._position);
    },

    getPosition: function(){
        (this._position / FULL_CLOSED) * 100
    },

    /**
     * Set value for 1-10 output port
     * @param adr port address
     * @param value 0-255
     */
    setAnalogOutput: function (adr, value) {
        return this._modbusMaster.writeSingleRegister(this._modbusAddr, OUTPUT_1_10V_REGISTERS[adr], value);
    },

});


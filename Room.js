var _ = require('lodash');
var MicroEvent  = require('microevent');
var moment = require('moment');

module.exports = Room;

function Room(thermostat, dumper, ac) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;

    this.enabled = false;
    this.fanSpeed = null;
    this.mode = null;
    this.roomTemp = null;
    this.tempSetpoint = null;
    this.isWeeklyProgram = null;

    this._rawData = [];
    this._oldData = [];

    this.watch();
}

MicroEvent.mixin(Room);

_.extend(Room.prototype, {
    update: function () {
        var th = this;
        return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 6).then(function (data) {
            th._rawData = data;

            th.enabled = data[ENABLED_REGISTER] != 90;
            th.fanSpeed = data[FAN_SPEED_REGISTER];
            th.mode = data[MODE_REGISTER];
            th.roomTemp = data[ROOM_TEMP_REGISTER] / 2;
            th.tempSetpoint = data[TEMP_SETPOINT_REGISTER] / 2;
            th.isWeeklyProgram = data[MANUAL_WEEKLY_PROG_REGISTER];
        })
    },

    toString: function(){
        return 'Status: '+ (this.enabled ? 'on' : 'off') +
            '; Room temp: ' + this.roomTemp + 'C; Set temp: ' + this.tempSetpoint +'C;'
    },

    watch: function () {
        var self = this;

        self.update().finally(function () {
            if (!_.isEqual(self._oldData, self._rawData)) {
                self.trigger('change', self);
                self._oldData = self._rawData.slice(0); //clone data array
            }

            setTimeout(function () {
                self.watch();
            }, 300)
        }).catch(ModbusCrcError, TimeoutError, function(){
            //do nothing
        });
    }
})


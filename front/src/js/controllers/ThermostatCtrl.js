require('../views/overview.html');

module.exports = function(ngModule){
    ngModule.controller('ThermostatCtrl', function ($scope){
        var socket = io({path: '/foo'});

        socket.on('data', function(resp){
            console.log(resp);
            $scope.$apply(function(){
                $scope.thermostats = resp.thermostats;
                $scope.acUnit = resp.acUnit;
            })
        });

        $scope.incrementTemp = function(thermostat, $index) {
            thermostat.tempSetpoint++;
            changeTemp(thermostat, $index);
        };

        $scope.decrementTemp = function(thermostat, $index) {
            thermostat.tempSetpoint--;
            changeTemp(thermostat, $index);
        };

        $scope.toggleEnable = _.debounce(function(thermostat, $index) {
            thermostat.enabled = !thermostat.enabled;
            socket.emit('thermostat.setEnable', {
                thermostat: $index,
                value: thermostat.enabled,
            })
        }, 300);

        var changeTemp = _.debounce(function changeTemp(thermostat, $index) {
            socket.emit('thermostat.changeTemp', {
                thermostat: $index,
                setpoint: thermostat.tempSetpoint,
            })
        }, 300);


        socket.on('thermostat.change', function(resp){
            console.log(resp);
            $scope.$apply(function(){
                $scope.thermostats[resp.index] = resp.data;
            })
        })
    })
};

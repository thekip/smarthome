webpackJsonp([0],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(1);
	var module = __webpack_require__(3).module('ClimateControl', []);

	module.controller('ThermostatCtrl', function ($scope){
	    var socket = io();

	    socket.on('data', function(resp){
	        console.log(resp);
	        $scope.$apply(function(){
	            $scope.thermostats = resp.thermostats;
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

	    $scope.toggleEnable = function(thermostat, $index) {
	        thermostat.enabled = !thermostat.enabled;
	        socket.emit('gui.setRoomEnable', {
	            id: $index,
	            value: thermostat.enabled,
	        })
	    };

	    function changeTemp(thermostat, $index) {
	        socket.emit('gui.changeRoomTemp', {
	            id: $index,
	            setpoint: thermostat.tempSetpoint,
	        })
	    }

	    socket.on('thermostat.change', function(resp){
	        console.log(resp);
	        $scope.$apply(function(){
	            $scope.thermostats[resp.index] = resp.data;
	        })
	    })
	})


/***/ }
]);
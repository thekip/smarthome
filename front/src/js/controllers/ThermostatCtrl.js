require('../views/overview.html');

module.exports = function(ngModule){
    ngModule.controller('ThermostatCtrl', function ($scope){
        var socket = io({path: '/foo'});

        socket.on('data', function(resp){
            console.log(resp);
            $scope.$apply(function(){
                $scope.rooms = resp.rooms;
                $scope.acUnit = resp.acUnit;
            })
        });

        $scope.incrementTemp = function(room, $index) {
            room.tempSetpoint++;
            changeTemp(room, $index);
        };

        $scope.decrementTemp = function(room, $index) {
            room.tempSetpoint--;
            changeTemp(room, $index);
        };

        $scope.toggleEnable = _.debounce(function(room, $index) {
            room.enabled = !room.enabled;
            socket.emit('gui.setRoomEnable', {
                id: $index,
                value: room.enabled,
            })
        }, 300);

        var changeTemp = _.debounce(function changeTemp(room, $index) {
            socket.emit('gui.changeRoomTemp', {
                id: $index,
                setpoint: room.tempSetpoint,
            })
        }, 300);


        socket.on('room.change', function(resp){
            console.log(resp);
            $scope.$apply(function(){
                $scope.rooms[resp.index] = resp.data;
            })
        })
    })
};

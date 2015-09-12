var gpio = require('pi-gpio')

function Adapter485() {}

Adapter485.attach = function(serial, pin){
    gpio.close(pin);


    serial.open = (function() {
        var original = serial.open;

        return function(callbackOriginal) {
            original.call(serial, function(){
                gpio.open(pin, "output pulldown", function(err) {
                    if (err)
                        console.log(err);

                    console.log('gpio opened');
                    callbackOriginal.apply(serial, arguments);
                });
            });
        };
    })();

    serial.write = (function() {
        var original = serial.write;

        return function() {
            var params = arguments;
            console.log('try to write');
            gpio.write(pin, 0, function(err) {          // Set pin 16 high (1)
                console.log('pin setted to 1', err);
                original.apply(serial, params);

                serial.drain(function(){
                    gpio.write(pin, 1, function(err){
                        console.log('pin setted to 0', err);
                    });
                })
            });
        };
    })();


};

module.exports = Adapter485;
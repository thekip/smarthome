module.exports = {
    modbusDevices: {
        acUnitAdress: 1,
        termostatsAdresses: [10, 11, 12]
    },
    serialPort: {
        device: '/dev/ttyAMA0', //"/dev/ttyUSB0"
            params: {
            baudrate: 19200 //2400
        }

    }

}
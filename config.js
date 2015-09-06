module.exports = {
    modbusDevices: {
        acUnitAdress: 1,
        termostatsAdresses: [10, 11, 12]
    },
    serialPort: {
        device: "/dev/ttyUSB0",
        params: {
            baudrate: 2400
        }

    }

}
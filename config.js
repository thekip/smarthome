module.exports = {
  modbusDevices: {
    acUnitAddress: 1,
    analogShieldAddress: 2,
  },
  rooms: [
    {
      thermostatAddress: 10,
      dumperPort: 0
    },
    {
      thermostatAddress: 11,
      dumperPort: 1
    },
    {
      thermostatAddress: 12,
      dumperPort: 2
    }
  ],
  bus1: {
    device: '/dev/ttyUSB3',
    params: {
      baudrate: 9600
    }
  },
  bus2: {
    device: '/dev/ttyUSB2',
    params: {
      baudrate: 2400 //2400
    }
  }
};

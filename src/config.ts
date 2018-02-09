export default {
  httpPort: 3000,
  modbusDevices: {
    acUnitAddress: 1,
    analogShieldAddress: 2,
  },
  rooms: [
    {
      thermostatAddress: 10,
      dumperPort: 0,
    },
    {
      thermostatAddress: 11,
      dumperPort: 1,
    },
    {
      thermostatAddress: 12,
      dumperPort: 2,
    },
  ],
  bus1: {
    device: '/dev/serial/by-id/usb-1a86_USB2.0-Serial-if00-port0',
    params: {
      baudRate: 9600,
    },
  },
  bus2: {
    device: '/dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0',
    params: {
      baudRate: 2400, // 2400
    },
  },
};

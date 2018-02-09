import { DeviceConnection } from './device-connection';
import _ from 'lodash';

describe('DeviceConnection', () => {
  it('Has default online status', () => {
    const connection = new DeviceConnection();
    expect(connection.online).toBeTruthy();
  });

  test('Change status to offline when errors count reached and revert status when success is called', () => {
    const maxErrorCount = 10;
    const connection = new DeviceConnection(maxErrorCount);

    _.times(maxErrorCount, () => {
      connection.error(new Error());
    });

    expect(connection.online).toBeFalsy();

    connection.success();

    expect(connection.online).toBeTruthy();
  });
});

test('Emit events when status changed', () => {
  const maxErrorCount = 10;
  const connection = new DeviceConnection(maxErrorCount);

  const lostCallback = jest.fn();
  const successCallback = jest.fn();

  connection.onConnectionLost.subscribe(lostCallback);
  connection.onConnectionRestore.subscribe(successCallback);

  _.times(maxErrorCount, () => {
    connection.error(new Error());
  });

  expect(lostCallback).toHaveBeenCalled();
  expect(successCallback).not.toHaveBeenCalled();

  lostCallback.mockReset();
  successCallback.mockReset();

  connection.success();

  expect(successCallback).toHaveBeenCalled();
  expect(lostCallback).not.toHaveBeenCalled();
});

test('Should emit event only once when status is changed', () => {
  const connection = new DeviceConnection(10);

  const handler = jest.fn();

  connection.onConnectionLost.subscribe(handler);

  _.times(20, () => {
    connection.error(new Error());
  });

  expect(handler).toHaveBeenCalledTimes(1);
});

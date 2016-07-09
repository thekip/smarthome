const test = require('tape');
const sinon = require('sinon');
const _ = require('lodash');
const tapSpec = require('tap-spec');

const DeviceConnection = require('./device-connection');

test.createStream()
  .pipe(tapSpec())
  .pipe(process.stdout);

test('Has default online status', function (t) {
  const connection = new DeviceConnection();
  t.ok(connection.online);
  t.end();
});


test('Change status to offline when errors count reached and revert status when success is called', function (t) {
  const maxErrorCount = 10;
  const connection = new DeviceConnection(maxErrorCount);

  _.times(maxErrorCount, () => {
      connection.error()
  });

  t.false(connection.online);

  connection.success();

  t.true(connection.online);

  t.end();
});


test('Emit events when status changed', function (t) {
  const maxErrorCount = 10;
  const connection = new DeviceConnection(maxErrorCount);

  const lostCallback = sinon.spy();
  const successCallback = sinon.spy();

  connection.onConnectionLost.bind(lostCallback);
  connection.onConnectionRestore.bind(successCallback);

  _.times(maxErrorCount, () => {
    connection.error()
  });

  t.true(lostCallback.called);
  t.false(successCallback.called);

  lostCallback.reset();
  successCallback.reset();

  connection.success();

  t.true(successCallback.called);
  t.false(lostCallback.called);

  t.end();
});

test('Should emit event only once when status is changed', function (t) {
  const connection = new DeviceConnection(10);

  const callback = sinon.spy();

  connection.onConnectionLost.bind(callback);

  _.times(20, () => {
    connection.error()
  });

  t.true(callback.calledOnce);

  t.end();
});

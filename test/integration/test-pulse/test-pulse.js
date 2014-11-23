/*global require: false, module: false */
"use strict";

var mod = function(
  _,
  Promise,
  App,
  Runtime,
  Exchange,
  Logger,
  HapticService,
  HapticClient,
  SimulatedDevice,
  LocalDevice
) {

  var Log = Logger.create("TestPulse");

  var TestPulse = function() {
    this.initialize.apply(this, arguments);
  };

  _.extend(TestPulse.prototype, App.prototype, {
    initialize: function() {
      App.prototype.initialize.apply(this, arguments);

      this._runtime = new Runtime();

      this._exchange = new Exchange({
        runtime: this._runtime
      });

      if (this.config("simulated")) {
        Log.debug("Using simulated device");
        this._device = new SimulatedDevice();
      } else {
        Log.debug("Using physical device");
        this._device = new LocalDevice();
      }

      this._service = new HapticService({
        exchange: this._exchange,
        device:   this._device
      });

      this._client = new HapticClient({
        exchange:        this._exchange,
        serviceIdentity: this._service.instanceId()
      });
    },

    up: Promise.method(function() {
      return this._service
        .start()
        .bind(this)
        .then(function() {
          return this._client.initSession();
        })
        .then(function(sessionId) {
          return this._client.testDevice({
            sessionId: sessionId,
            pulses: 5,
            pulseDuration: 500
          });
        });
    }),

    down: Promise.method(function() {

    })
  });

  return TestPulse;
};

var thicket = require("thicket"),
    animus = require("../../../lib-node/animus");

var TestPulse = mod(
  require("underscore"),
  require("bluebird"),
  thicket.c("app"),
  thicket.c("runtime"),
  thicket.c("messaging/exchange"),
  thicket.c("logger"),
  animus.c("haptic-service"),
  animus.c("haptic-client"),
  animus.c("devices/simulated"),
  animus.c("devices/local")
);


var Bootstrapper = thicket.c("bootstrapper"),
    Logger = thicket.c("logger"),
    CLA = thicket.c("appenders/console-log");

Logger.root().setLogLevel("Debug");
Logger.root().addAppender(new CLA());

var b = new Bootstrapper({
  applicationConstructor: TestPulse
});

b
  .bootstrap()
  .then(function(app) {
    return app.start().then(function() {
      return app.stop();
    })
  });
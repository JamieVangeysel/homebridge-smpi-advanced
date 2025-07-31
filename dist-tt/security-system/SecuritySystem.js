"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecuritySystemTargetState = exports.SecuritySystemCurrentState = exports.SecuritySystem = void 0;
const cross_fetch_1 = require("cross-fetch");
class SecuritySystem {
    constructor(platform, accessory, config) {
        var _a, _b;
        this.platform = platform;
        this.accessory = accessory;
        this.config = config;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, (_a = config.make) !== null && _a !== void 0 ? _a : 'Manufacturer unknown')
            .setCharacteristic(this.platform.Characteristic.Model, (_b = config.model) !== null && _b !== void 0 ? _b : 'Model unknown')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'yayeet');
        // get the Thermostat service if it exists, otherwise create a new Thermostat service
        // you can create multiple services for each accessory
        this.alarmService = this.accessory.getService(this.platform.Service.SecuritySystem)
            || this.accessory.addService(this.platform.Service.SecuritySystem);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.alarmService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);
        // create handlers for required characteristics
        this.alarmService.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
            .on('get', this.handleSecuritySystemCurrentStateGet.bind(this));
        this.alarmService.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
            .on('get', this.handleSecuritySystemTargetStateGet.bind(this))
            .on('set', this.handleSecuritySystemTargetStateSet.bind(this));
        this.currentState = SecuritySystemCurrentState.DISARMED;
        this.targetState = SecuritySystemTargetState.DISARM;
    }
    /**
     * Handle requests to get the current value of the "Security System Current State" characteristic
     */
    handleSecuritySystemCurrentStateGet(callback) {
        this.platform.log.debug('Triggered GET SecuritySystemCurrentState');
        callback(null, this.currentState);
        return;
    }
    /**
     * Handle requests to get the current value of the "Security System Target State" characteristic
     */
    handleSecuritySystemTargetStateGet(callback) {
        this.platform.log.debug('Triggered GET SecuritySystemTargetState');
        callback(null, this.targetState);
        return;
    }
    /**
     * Handle requests to set the "Security System Target State" characteristic
     */
    handleSecuritySystemTargetStateSet(value, callback) {
        this.platform.log.debug('Triggered SET SecuritySystemTargetState:', value);
        this.targetState = value;
        setTimeout(() => {
            switch (this.targetState) {
                case SecuritySystemTargetState.STAY_ARM:
                    this.currentState = SecuritySystemCurrentState.STAY_ARM;
                    return;
                case SecuritySystemTargetState.AWAY_ARM:
                    this.currentState = SecuritySystemCurrentState.AWAY_ARM;
                    return;
                case SecuritySystemTargetState.NIGHT_ARM:
                    this.currentState = SecuritySystemCurrentState.NIGHT_ARM;
                    return;
                case SecuritySystemTargetState.DISARM:
                    if (this.config.sirenEnabled) {
                        (0, cross_fetch_1.fetch)(this.config.siren.offUrl).then(async (r) => {
                            this.currentState = SecuritySystemCurrentState.DISARMED;
                        });
                    }
                    return;
            }
        }, 18);
        callback(null, this.targetState);
        return;
    }
}
exports.SecuritySystem = SecuritySystem;
var SecuritySystemCurrentState;
(function (SecuritySystemCurrentState) {
    SecuritySystemCurrentState[SecuritySystemCurrentState["STAY_ARM"] = 0] = "STAY_ARM";
    SecuritySystemCurrentState[SecuritySystemCurrentState["AWAY_ARM"] = 1] = "AWAY_ARM";
    SecuritySystemCurrentState[SecuritySystemCurrentState["NIGHT_ARM"] = 2] = "NIGHT_ARM";
    SecuritySystemCurrentState[SecuritySystemCurrentState["DISARMED"] = 3] = "DISARMED";
    SecuritySystemCurrentState[SecuritySystemCurrentState["ALARM_TRIGGERED"] = 4] = "ALARM_TRIGGERED";
})(SecuritySystemCurrentState = exports.SecuritySystemCurrentState || (exports.SecuritySystemCurrentState = {}));
var SecuritySystemTargetState;
(function (SecuritySystemTargetState) {
    SecuritySystemTargetState[SecuritySystemTargetState["STAY_ARM"] = 0] = "STAY_ARM";
    SecuritySystemTargetState[SecuritySystemTargetState["AWAY_ARM"] = 1] = "AWAY_ARM";
    SecuritySystemTargetState[SecuritySystemTargetState["NIGHT_ARM"] = 2] = "NIGHT_ARM";
    SecuritySystemTargetState[SecuritySystemTargetState["DISARM"] = 3] = "DISARM";
})(SecuritySystemTargetState = exports.SecuritySystemTargetState || (exports.SecuritySystemTargetState = {}));
//# sourceMappingURL=SecuritySystem.js.map
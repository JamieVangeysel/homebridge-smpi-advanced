"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchAccessory = void 0;
const cross_fetch_1 = require("cross-fetch");
// implement https://developers.homebridge.io/#/service/TargetControl
class SwitchAccessory {
    constructor(platform, accessory, config) {
        var _a;
        this.platform = platform;
        this.accessory = accessory;
        this.config = config;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Simplintho')
            .setCharacteristic(this.platform.Characteristic.Model, config.type === 'statefull' ? 'Stetefull Switch' : 'Simplintho Neo Plug')
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '1.0')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, (_a = config.ip) !== null && _a !== void 0 ? _a : 'unknown');
        // get the Switch service if it exists, otherwise create a new Switch service
        // you can create multiple services for each accessory
        this.service = this.accessory.getService(this.platform.Service.Switch)
            || this.accessory.addService(this.platform.Service.Switch);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Switch
        // create handlers for required characteristics
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.handleOnGet.bind(this))
            .on('set', this.handleOnSet.bind(this));
        this.initializeStatus();
    }
    initializeStatus() {
        if (this.config.type === 'http' && this.config.stateUrl) {
            (0, cross_fetch_1.fetch)(this.config.stateUrl).then(response => {
                response.json().then(result => {
                    if (result.status === true) {
                        this.service.setCharacteristic(this.platform.Characteristic.On, true);
                    }
                    else {
                        this.service.setCharacteristic(this.platform.Characteristic.On, false);
                    }
                }).catch(() => {
                    this.platform.log.error(`Error while parsing data from '${this.config.stateUrl}' to json.`);
                });
            }).catch(() => {
                this.platform.log.error(`Error while fetching data from '${this.config.stateUrl}'.`);
            });
        }
        if (this.config.type === 'statefull') {
            if (this.config.custom) {
                const date = new Date();
                switch (this.config.definition.type) {
                    case 'dayOfTheWeek':
                        if (this.config.definition.day === date.getDay()) {
                            this.service.setCharacteristic(this.platform.Characteristic.On, true);
                        }
                        else {
                            this.service.setCharacteristic(this.platform.Characteristic.On, false);
                        }
                        break;
                    case 'dayOfTheWeekGroup':
                        if (this.config.definition.days.indexOf(date.getDay()) > -1) {
                            this.service.setCharacteristic(this.platform.Characteristic.On, true);
                        }
                        else {
                            this.service.setCharacteristic(this.platform.Characteristic.On, false);
                        }
                        break;
                }
            }
            else {
                console.log('not custom');
            }
        }
    }
    /**
     * Handle requests to get the current value of the "On" characteristic
     */
    async handleOnGet(callback) {
        this.platform.log.debug('Triggered GET On');
        // set this to a valid value for On
        if (this.config.type === 'http' && this.config.stateUrl) {
            try {
                const response = await (0, cross_fetch_1.fetch)(this.config.stateUrl);
                try {
                    const result = await response.json();
                    if (result.status === true) {
                        callback(null, true);
                    }
                    else {
                        callback(null, false);
                    }
                    return;
                }
                catch (_a) {
                    this.platform.log.error(`Error while parsing data from '${this.config.stateUrl}' to json ${response}.`);
                }
            }
            catch (_b) {
                this.platform.log.warn(`Error while fetching data from '${this.config.stateUrl}'.`);
            }
        }
        if (this.config.type === 'statefull') {
            if (this.config.custom) {
                const date = new Date();
                switch (this.config.definition.type) {
                    case 'dayOfTheWeek':
                        if (this.config.definition.day === date.getDay()) {
                            callback(null, true);
                        }
                        else {
                            callback(null, false);
                        }
                        return;
                    case 'dayOfTheWeekGroup':
                        if (this.config.definition.days.indexOf(date.getDay()) > -1) {
                            callback(null, true);
                        }
                        else {
                            callback(null, false);
                        }
                        return;
                }
            }
            else {
                console.log('not custom');
            }
        }
        callback(null, 0);
    }
    /**
     * Handle requests to set the "On" characteristic
     */
    async handleOnSet(value, callback) {
        this.platform.log.debug('Triggered SET On:', value);
        if (value === true) {
            if (this.config.type === 'http' && this.config.onUrl) {
                await (0, cross_fetch_1.fetch)(this.config.onUrl).catch(() => {
                    this.platform.log.error(`Error while fetching data from '${this.config.onUrl}'.`);
                });
            }
        }
        else {
            if (this.config.type === 'http' && this.config.offUrl) {
                await (0, cross_fetch_1.fetch)(this.config.offUrl).catch(() => {
                    this.platform.log.error(`Error while fetching data from '${this.config.offUrl}'.`);
                });
            }
        }
        callback(null);
    }
}
exports.SwitchAccessory = SwitchAccessory;
//# sourceMappingURL=SwitchAccessory.js.map
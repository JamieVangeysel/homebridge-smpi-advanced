"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeoThermostatAccessory = void 0;
const cross_fetch_1 = require("cross-fetch");
class NeoThermostatAccessory {
    constructor(platform, accessory, config) {
        this.platform = platform;
        this.accessory = accessory;
        this.config = config;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Simplintho')
            .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Simplintho Neo HVAC')
            .setCharacteristic(this.platform.api.hap.Characteristic.FirmwareRevision, '1.0')
            .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, config.uuid);
        // get the Thermostat service if it exists, otherwise create a new Thermostat service
        // you can create multiple services for each accessory
        this.service = this.accessory.getService(this.platform.Service.Thermostat)
            || this.accessory.addService(this.platform.Service.Thermostat);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.api.hap.Characteristic.Name, accessory.context.device.exampleDisplayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Thermostat
        // create handlers for required characteristics
        this.service.getCharacteristic(this.platform.api.hap.Characteristic.CurrentHeatingCoolingState)
            .on('get', this.handleCurrentHeatingCoolingStateGet.bind(this));
        this.service.getCharacteristic(this.platform.api.hap.Characteristic.TargetHeatingCoolingState)
            .on('get', this.handleTargetHeatingCoolingStateGet.bind(this))
            .on('set', this.handleTargetHeatingCoolingStateSet.bind(this));
        this.service.getCharacteristic(this.platform.api.hap.Characteristic.CurrentTemperature)
            .on('get', this.handleCurrentTemperatureGet.bind(this));
        this.service.getCharacteristic(this.platform.api.hap.Characteristic.TargetTemperature)
            .on('get', this.handleTargetTemperatureGet.bind(this))
            .on('set', this.handleTargetTemperatureSet.bind(this));
        this.service.getCharacteristic(this.platform.api.hap.Characteristic.TemperatureDisplayUnits)
            .on('get', this.handleTemperatureDisplayUnitsGet.bind(this))
            .on('set', this.handleTemperatureDisplayUnitsSet.bind(this));
    }
    /**
     * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
     */
    async handleCurrentHeatingCoolingStateGet(callback) {
        this.platform.log.debug('Triggered GET CurrentHeatingCoolingState');
        const response = await (0, cross_fetch_1.fetch)(`${this.url}/current-state`);
        try {
            const result = await response.json();
            callback(null, result.value);
            return;
        }
        catch (_a) {
            this.platform.log.error(`Error while parsing data from '${this.url}/current-state' to json ${response}.`);
        }
    }
    /**
     * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
     */
    async handleTargetHeatingCoolingStateGet(callback) {
        this.platform.log.debug('Triggered GET TargetHeatingCoolingState');
        const response = await (0, cross_fetch_1.fetch)(`${this.url}/target-state`);
        try {
            const result = await response.json();
            callback(null, result.value);
            return;
        }
        catch (_a) {
            this.platform.log.error(`Error while parsing data from '${this.url}/target-state' to json ${response}.`);
        }
    }
    /**
     * Handle requests to set the "Target Heating Cooling State" characteristic
     */
    async handleTargetHeatingCoolingStateSet(value, callback) {
        this.platform.log.debug('Triggered SET TargetHeatingCoolingState:', value);
        // const state: HeatingCoolingStateEnum = value as HeatingCoolingStateEnum;
        await (0, cross_fetch_1.fetch)(`${this.url}/target-state`, {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            //make sure to serialize your JSON body
            body: JSON.stringify({ value }),
        });
        callback(null);
    }
    /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
    async handleCurrentTemperatureGet(callback) {
        this.platform.log.debug('Triggered GET CurrentTemperature');
        const response = await (0, cross_fetch_1.fetch)(`${this.url}/current-temperature`);
        try {
            const result = await response.json();
            callback(null, result.value);
            return;
        }
        catch (_a) {
            this.platform.log.error(`Error while parsing data from '${this.url}/current-temperature' to json ${response}.`);
        }
    }
    /**
     * Handle requests to get the current value of the "Target Temperature" characteristic
     */
    async handleTargetTemperatureGet(callback) {
        this.platform.log.debug('Triggered GET TargetTemperature');
        const response = await (0, cross_fetch_1.fetch)(`${this.url}/target-temperature`);
        try {
            const result = await response.json();
            callback(null, result.value);
            return;
        }
        catch (_a) {
            this.platform.log.error(`Error while parsing data from '${this.url}/target-temperature' to json ${response}.`);
        }
    }
    /**
     * Handle requests to set the "Target Temperature" characteristic
     */
    async handleTargetTemperatureSet(value, callback) {
        this.platform.log.debug('Triggered SET TargetTemperature:', value);
        // const temperature: number = value as number;
        await (0, cross_fetch_1.fetch)(`${this.url}/target-temperature`, {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            //make sure to serialize your JSON body
            body: JSON.stringify({ value }),
        });
        callback(null);
    }
    /**
     * Handle requests to get the current value of the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsGet(callback) {
        this.platform.log.debug('Triggered GET TemperatureDisplayUnits');
        // set this to a valid value for TemperatureDisplayUnits
        // const currentValue: TemperatureDisplayUnits = this.state.temperatureDisplayUnits;
        callback(null, TemperatureDisplayUnits.CELSIUS);
    }
    /**
     * Handle requests to set the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsSet(value, callback) {
        this.platform.log.debug('Triggered SET TemperatureDisplayUnits:', value);
        // const displayUnit: TemperatureDisplayUnits = value as TemperatureDisplayUnits;
        // this.state.temperatureDisplayUnits = displayUnit;
        callback(null);
    }
    get url() {
        return `http://${this.config.ip}:8080`;
    }
}
exports.NeoThermostatAccessory = NeoThermostatAccessory;
var HeatingCoolingStateEnum;
(function (HeatingCoolingStateEnum) {
    HeatingCoolingStateEnum[HeatingCoolingStateEnum["OFF"] = 0] = "OFF";
    HeatingCoolingStateEnum[HeatingCoolingStateEnum["HEAT"] = 1] = "HEAT";
    HeatingCoolingStateEnum[HeatingCoolingStateEnum["COOL"] = 2] = "COOL";
    HeatingCoolingStateEnum[HeatingCoolingStateEnum["AUTO"] = 3] = "AUTO";
})(HeatingCoolingStateEnum || (HeatingCoolingStateEnum = {}));
var TemperatureDisplayUnits;
(function (TemperatureDisplayUnits) {
    TemperatureDisplayUnits[TemperatureDisplayUnits["CELSIUS"] = 0] = "CELSIUS";
    TemperatureDisplayUnits[TemperatureDisplayUnits["FAHRENHEIT"] = 1] = "FAHRENHEIT";
})(TemperatureDisplayUnits || (TemperatureDisplayUnits = {}));
//# sourceMappingURL=NeoThermostatAccessory.js.map

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeoSensorAccessory = void 0;
const cross_fetch_1 = require("cross-fetch");
// import { FakeGatoHistoryService } from 'fakegato-history';
class NeoSensorAccessory {
    // private log: Logger;
    constructor(platform, accessory, config) {
        this.platform = platform;
        this.accessory = accessory;
        this.config = config;
        // private loggingService: FakeGatoHistoryService;
        this.temperature = null;
        this.humidity = null;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Simplintho')
            .setCharacteristic(this.platform.Characteristic.Model, 'Simplintho Neo THP10')
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '0.0.0')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, config.uuid);
        // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
        // you can create multiple services for each accessory
        this.serviceTemperature = this.accessory.getService(this.platform.Service.TemperatureSensor)
            || this.accessory.addService(this.platform.Service.TemperatureSensor);
        // get the serviceHumidity service if it exists, otherwise create a new serviceHumidity service
        this.serviceHumidity = this.accessory.getService(this.platform.Service.HumiditySensor)
            || this.accessory.addService(this.platform.Service.HumiditySensor);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.serviceTemperature.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);
        this.serviceHumidity.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);
        // this.log = this.platform.log;
        // this.loggingService = new FakeGatoHistoryService('weather', this, {
        //   storage: 'fs',
        //   disableTimer: true,
        //   path: this.platform.api.user.cachedAccessoryPath(),
        // });
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/HumiditySensor
        // see https://developers.homebridge.io/#/service/TemperatureSensor
        // create handlers for required characteristics
        this.serviceTemperature.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .on('get', this.handleCurrentTemperatureGet.bind(this));
        // create handlers for required characteristics
        this.serviceHumidity.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .on('get', this.handleCurrentRelativeHumidityGet.bind(this));
        /**
         * Updating characteristics values asynchronously.
         *
         * Example showing how to update the state of a Characteristic asynchronously instead
         * of using the `on('get')` handlers.
         * Here we change update the motion sensor trigger states on and off every 10 seconds
         * the `updateCharacteristic` method.
         *
         */
        this.updateStatus();
        setInterval(() => {
            this.updateStatus();
        }, 3000);
    }
    async updateStatus() {
        let temperature = null;
        let humidity = null;
        try {
            await (0, cross_fetch_1.fetch)(this.url).then(async (r) => {
                const response = await r.json();
                if (response.temperature) {
                    temperature = response.temperature;
                }
                if (response.humidity) {
                    humidity = response.humidity * 100;
                }
            }).catch(() => {
                this.platform.log.error(`Could not get data from '${this.url}'.`);
            });
            this.temperature = temperature !== null && temperature !== void 0 ? temperature : 0;
            this.humidity = humidity !== null && humidity !== void 0 ? humidity : 0;
            // this.loggingService.addEntry({
            //   time: new Date().getTime() / 1000,
            //   temp: this.temperature,
            //   pressure: 1024,
            //   humidity: this.humidity,
            // });
            this.serviceTemperature.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.temperature);
            this.serviceHumidity.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.humidity);
        }
        catch (err) {
            this.platform.log.error(`Could not get data from '${this.url}'.`);
        }
    }
    /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
    handleCurrentTemperatureGet(callback) {
        var _a;
        this.platform.log.debug('Triggered GET CurrentTemperature');
        // set this to a valid value for CurrentTemperature
        const currentValue = (_a = this.temperature) !== null && _a !== void 0 ? _a : 0;
        callback(null, currentValue);
    }
    /**
     * Handle requests to get the current value of the "Current Relative Humidity" characteristic
     */
    handleCurrentRelativeHumidityGet(callback) {
        var _a;
        this.platform.log.debug('Triggered GET CurrentRelativeHumidity');
        // set this to a valid value for CurrentRelativeHumidity
        const currentValue = (_a = this.humidity) !== null && _a !== void 0 ? _a : 0;
        callback(null, currentValue);
    }
    get url() {
        return `https://simplintho-neo-dev.azurewebsites.net/devices/${this.config.uuid}`;
    }
}
exports.NeoSensorAccessory = NeoSensorAccessory;
//# sourceMappingURL=NeoSensorAccessory.js.map
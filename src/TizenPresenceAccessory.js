"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TizenPresenceAccessory = void 0;
const cross_fetch_1 = require("cross-fetch");
var ping = require('ping');
class TizenPresenceAccessory {
    constructor(platform, accessory, config) {
        this.platform = platform;
        this.accessory = accessory;
        this.config = config;
        /**
         * These are just used to create a working example
         * You should implement your own code to track the state of your accessory
         */
        this.isOccupied = false;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Samsung')
            .setCharacteristic(this.platform.Characteristic.Model, config.type)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, config.ip);
        // get the OccupancySensor service if it exists, otherwise create a new OccupancySensor service
        // you can create multiple services for each accessory
        this.service = this.accessory.getService(this.platform.Service.OccupancySensor)
            || this.accessory.addService(this.platform.Service.OccupancySensor);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/OccupancySensor
        // register handlers for the On/Off Characteristic
        this.service.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
            .on('get', this.handleOccupancyDetectedGet.bind(this)); // GET - bind to the `handleOccupancyDetectedGet` method below
        /**
         * Updating characteristics values asynchronously.
         *
         * Example showing how to update the state of a Characteristic asynchronously instead
         * of using the `on('get')` handlers.
         * Here we change update the motion sensor trigger states on and off every 10 seconds
         * the `updateCharacteristic` method.
         *
         */
        this.updateStatus(true);
        this.myTimer = setInterval(async () => {
            const value = await this.updateStatus();
            if (value !== this.isOccupied) {
                this.isOccupied = value;
                this.platform.log.debug('Triggering motionSensorOneService:', this.isOccupied);
            }
        }, 2000);
    }
    async updateStatus(updateInfo = false) {
        // set initial value to current value
        let isOccupied = this.isOccupied;
        try {
            var cfg = {
                timeout: 1
            };
            const host = this.config.ip;
            const isAlive = await ping.promise.probe(host, cfg);
            if (isAlive) {
                const r = await (0, cross_fetch_1.fetch)(`http://${this.config.ip}:8001/api/v2/`);
                const response = await r.json();
                if (response.device.PowerState === 'on') {
                    isOccupied = true;
                }
                else {
                    // fix wont turn off after initial value has been set
                    isOccupied = false;
                }
                if (updateInfo) {
                    // set accessory information
                    this.accessory.getService(this.platform.Service.AccessoryInformation)
                        .setCharacteristic(this.platform.Characteristic.Manufacturer, response.device.type)
                        .setCharacteristic(this.platform.Characteristic.Model, response.device.modelName)
                        .setCharacteristic(this.platform.Characteristic.SerialNumber, response.device.id.substring(5));
                }
            }
            else {
                isOccupied = false;
            }
        }
        catch (err) {
            // this.platform.log.warn(`Could not get powerOn data from 'http://${this.config.ip}:8001/api/v2/'.`);
        }
        this.service.updateCharacteristic(this.platform.Characteristic.OccupancyDetected, isOccupied);
        // return the actual result te avoid always off
        return isOccupied;
    }
    /**
     * Handle the "GET" requests from HomeKit
     * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * If your device takes time to respond you should update the status of your device
     * asynchronously instead using the `updateCharacteristic` method instead.
     *
     */
    handleOccupancyDetectedGet(callback) {
        // implement your own code to check if the device is occupied
        const isOccupied = this.isOccupied;
        this.platform.log.debug('Get Characteristic OccupancyDetected ->', isOccupied);
        // you must call the callback function
        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, isOccupied);
    }
}
exports.TizenPresenceAccessory = TizenPresenceAccessory;
//# sourceMappingURL=TizenPresenceAccessory.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomebridgePlatform = void 0;
const settings_1 = require("./settings");
const TizenPresenceAccessory_1 = require("./TizenPresenceAccessory");
const NeoSensorAccessory_1 = require("./NeoSensorAccessory");
const NeoThermostatAccessory_1 = require("./NeoThermostatAccessory");
const SwitchAccessory_1 = require("./SwitchAccessory");
const SecuritySystem_1 = require("./security-system/SecuritySystem");
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class HomebridgePlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.foundAccessoires = [];
        this.log.debug('Finished initializing platform:', this.config.name);
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices() {
        var _a, _b;
        const config = this.config;
        for (const device of config.presenceDetectors) {
            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address (using url, schould be constant!)
            const uuid = this.api.hap.uuid.generate(device.ip);
            this.foundAccessoires.push(uuid);
            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                // the accessory already exists
                if (device) {
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                    // existingAccessory.context.device = device;
                    // this.api.updatePlatformAccessories([existingAccessory]);
                    switch (device.type) {
                        case 'Samsung SmartTV':
                            // create the accessory handler for the newly create accessory
                            // this is imported from `TizenPresenceAccessory.ts`
                            new TizenPresenceAccessory_1.TizenPresenceAccessory(this, existingAccessory, device);
                            break;
                        default:
                            this.log.warn(`Device type '${device.type}' is invalid for presenceDetector!`);
                            break;
                    }
                }
                else if (!device) {
                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                    // remove platform accessories when no longer present
                    this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [existingAccessory]);
                    this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
            }
            else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.name);
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
                switch (device.type) {
                    case 'Samsung SmartTV':
                        // create the accessory handler for the newly create accessory
                        // this is imported from `TizenPresenceAccessory.ts`
                        new TizenPresenceAccessory_1.TizenPresenceAccessory(this, accessory, device);
                        break;
                    default:
                        this.log.warn(`Device type '${device.type}' is invalid for presenceDetector!`);
                        break;
                }
                // link the accessory to your platform
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            }
        }
        for (const device of config.neoSensors) {
            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address (using url, schould be constant!)
            const uuid = this.api.hap.uuid.generate(device.uuid);
            this.foundAccessoires.push(uuid);
            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                // the accessory already exists
                if (device) {
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                    // existingAccessory.context.device = device;
                    // this.api.updatePlatformAccessories([existingAccessory]);
                    new NeoSensorAccessory_1.NeoSensorAccessory(this, existingAccessory, device);
                }
                else if (!device) {
                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                    // remove platform accessories when no longer present
                    this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [existingAccessory]);
                    this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
            }
            else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.name);
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
                new NeoSensorAccessory_1.NeoSensorAccessory(this, accessory, device);
                // link the accessory to your platform
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            }
        }
        for (const device of config.thermostats) {
            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address (using url, schould be constant!)
            const uuid = this.api.hap.uuid.generate(device.uuid);
            this.foundAccessoires.push(uuid);
            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                // the accessory already exists
                if (device) {
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                    // existingAccessory.context.device = device;
                    // this.api.updatePlatformAccessories([existingAccessory]);
                    new NeoThermostatAccessory_1.NeoThermostatAccessory(this, existingAccessory, device);
                }
                else if (!device) {
                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                    // remove platform accessories when no longer present
                    this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [existingAccessory]);
                    this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
            }
            else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.name);
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
                new NeoThermostatAccessory_1.NeoThermostatAccessory(this, accessory, device);
                // link the accessory to your platform
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            }
        }
        for (const device of config.switches) {
            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address (using url, schould be constant!)
            const uuid = this.api.hap.uuid.generate((_b = (_a = device.onUrl) !== null && _a !== void 0 ? _a : device.ip) !== null && _b !== void 0 ? _b : device.name);
            this.foundAccessoires.push(uuid);
            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                // the accessory already exists
                if (device) {
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                    // existingAccessory.context.device = device;
                    // this.api.updatePlatformAccessories([existingAccessory]);
                    new SwitchAccessory_1.SwitchAccessory(this, existingAccessory, device);
                }
                else if (!device) {
                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                    // remove platform accessories when no longer present
                    this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [existingAccessory]);
                    this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
            }
            else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.name);
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
                new SwitchAccessory_1.SwitchAccessory(this, accessory, device);
                // link the accessory to your platform
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            }
        }
        for (const device of config.securitySystems) {
            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address (using url, schould be constant!)
            const uuid = this.api.hap.uuid.generate(device.name);
            this.foundAccessoires.push(uuid);
            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                // the accessory already exists
                if (device) {
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                    // existingAccessory.context.device = device;
                    // this.api.updatePlatformAccessories([existingAccessory]);
                    new SecuritySystem_1.SecuritySystem(this, existingAccessory, device);
                }
                else if (!device) {
                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                    // remove platform accessories when no longer present
                    this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [existingAccessory]);
                    this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
            }
            else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.name);
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
                new SecuritySystem_1.SecuritySystem(this, accessory, device);
                // link the accessory to your platform
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            }
        }
        // remove all accesoires that were not found in condig
        this.accessories.forEach(r => {
            // if there was no match on UUID
            if (!this.foundAccessoires.some(e => e === r.UUID)) {
                this.log.warn(`Accessory '${r.displayName}' war removed due to missing link in config!`);
                this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [r]);
            }
        });
    }
}
exports.HomebridgePlatform = HomebridgePlatform;
//# sourceMappingURL=platform.js.map
import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic
} from 'homebridge'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings'
import { NeoSensorAccessory } from './NeoSensorAccessory'
import { SolarAccessory } from './SolarAccessory'
import { ThermostatAccessory } from './ThermostatAccessory'

export class HomebridgePlatform implements DynamicPlatformPlugin {
  readonly log: Logger
  readonly config: PlatformConfig
  readonly api: API
  readonly Service: typeof Service
  readonly Characteristic: typeof Characteristic
  readonly accessories: PlatformAccessory[]

  foundAccessoires: string[]

  constructor(log: Logger, config: PlatformConfig, api: API) {
    this.log = log
    this.config = config
    this.api = api
    this.Service = this.api.hap.Service
    this.Characteristic = this.api.hap.Characteristic

    // this is used to track restored cached accessories
    this.accessories = []
    this.foundAccessoires = []

    this.log.debug('Finished initializing platform:', this.config.name)
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback')
      // run the method to discover / register your devices as accessories
      this.discoverDevices()
    })
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName)
    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory)
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices(): void {
    const config: IPlatformConfig = this.config as IPlatformConfig

    config.neoSensors.forEach(this.setupNeoSensor.bind(this))
    // config.thermostats.forEach(this.setupThermostat.bind(this))

    this.setupNeoSunriseSunset()

    // remove all accessories that were not found in config
    for (let accessory of this.accessories) {
      // if there was no match on UUID
      if (!this.foundAccessoires.some(function matchUUID(e) {
        return e === accessory.UUID
      })) {
        this.log.warn(`Accessory '${accessory.displayName}' war removed due to missing link in config!`)
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
      }
    }
  }

  setupNeoSensor(device: INeoTemperatureSensor): void {
    // generate a unique id for the accessory this should be generated from
    // something globally unique, but constant, for example, the device serial
    // number or MAC address (using url, should be constant!)
    const uuid = this.api.hap.uuid.generate(device.uuid)
    this.foundAccessoires.push(uuid)
    let isUuid = (accessory: any) => accessory.UUID === uuid
    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    const existingAccessory = this.accessories.find(isUuid)
    if (existingAccessory) {
      // the accessory already exists
      if (device) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName)
        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);
        const a = new NeoSensorAccessory(this, existingAccessory, device)
      } else if (!device) {
        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory])
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName)
      }
    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', device.name)
      // create a new accessory
      const accessory = new this.api.platformAccessory(device.name, uuid)
      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.device = device
      const a = new NeoSensorAccessory(this, accessory, device)
      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
    }
  }

  setupThermostat(device: IThermostat): void {
    const uuid = this.api.hap.uuid.generate(`${device.host}-${device.instance ?? 'default'}`)
    this.foundAccessoires.push(uuid)
    let isUuid = (accessory: any) => accessory.UUID === uuid
    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    const existingAccessory = this.accessories.find(isUuid)
    if (existingAccessory) {
      // the accessory already exists
      if (device) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName)
        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);
        const t = new ThermostatAccessory(this, existingAccessory, device)
      } else if (!device) {
        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory])
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName)
      }
    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', device.name)
      // create a new accessory
      const accessory = new this.api.platformAccessory(device.name, uuid)
      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.device = device
      const t = new ThermostatAccessory(this, accessory, device)
      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
    }
  }

  setupNeoSunriseSunset() {
    const uuid = this.api.hap.uuid.generate('SunriseSunset')
    this.foundAccessoires.push(uuid)
    let isUuid = (accessory: any) => accessory.UUID === uuid
    const existingAccessory = this.accessories.find(isUuid)
    if (existingAccessory) {
      // the accessory already exists
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName)
      // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
      // existingAccessory.context.device = device;
      // this.api.updatePlatformAccessories([existingAccessory]);
      const a = new SolarAccessory(this, existingAccessory)
    } else {
      // create a new accessory
      const accessory = new this.api.platformAccessory('SunriseSunset', uuid)
      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      // accessory.context.device = device
      const a = new SolarAccessory(this, accessory)
      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
    }
  }
}

export interface IPlatformConfig extends Record<string, unknown> {
  platform: string;
  name?: string;
  presenceDetectors: IPresenceDetector[];
  motionDetectors: IMotionDetector[];
  neoSensors: INeoTemperatureSensor[];
  thermostats: IThermostat[];
  securitySystems: ISecuritySystem[];
}

export interface IPresenceDetector {
  ip: string;
  name: string;
  model?: string | undefined
}

export interface IMotionDetector {
  ip: string;
  name: string;
  type: string;
}

export interface INeoTemperatureSensor {
  uuid: string;
  owner: string;
  name: string;
}

export interface IThermostat {
  name: string
  port: number
  instance?: string
  host: string
}

export interface ISecuritySystem {
  name: string;
  hostname: string;
  port: number;
  make?: string | undefined;
  model?: string | undefined;
  sirenEnabled?: boolean;
  siren: {
    hostname: string;
    onUrl: string;
    offUrl: string;
  };
}

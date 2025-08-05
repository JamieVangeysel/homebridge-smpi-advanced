import { HomebridgePlatform, IPresenceDetector } from './platform'
import { PlatformAccessory, Service } from 'homebridge'

import fetch from 'cross-fetch'
import ping from 'ping'

export class TizenPresenceAccessory {
  private readonly platform: HomebridgePlatform
  private readonly accessory: PlatformAccessory
  private readonly config: IPresenceDetector
  private readonly service: Service

  private isOccupied: boolean = false

  constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: IPresenceDetector) {
    this.platform = platform
    this.accessory = accessory
    this.config = config

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Vangeysel')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, config.model ?? 'Unknown')
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, config.ip)
    // get the OccupancySensor service if it exists, otherwise create a new OccupancySensor service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.OccupancySensor)
      || this.accessory.addService(this.platform.Service.OccupancySensor)
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.api.hap.Characteristic.Name, accessory.context.device.exampleDisplayName)
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/OccupancySensor
    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.api.hap.Characteristic.OccupancyDetected)
      .on('get', this.handleOccupancyDetectedGet.bind(this)) // GET - bind to the `handleOccupancyDetectedGet` method below

    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
    this.updateStatus(true)

    const update = async (): Promise<void> => {
      const value = await this.updateStatus()
      if (value !== this.isOccupied) {
        this.isOccupied = value
        this.platform.log.debug('Triggering motionSensorOneService:', this.isOccupied)
      }
    }

    setInterval(update, 2000)
  }

  async updateStatus(updateInfo = false) {
    // set initial value to current value
    let isOccupied = this.isOccupied
    try {
      const cfg = {
        timeout: 1
      }
      const host = this.config.ip
      const isAlive = await ping.promise.probe(host, cfg)
      if (isAlive) {
        const r = await fetch(`http://${this.config.ip}:8001/api/v2/`)
        const response = await r.json()
        isOccupied = response.device.PowerState === 'on'
        if (updateInfo) {
          // set accessory information
          this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, response.device.type)
            .setCharacteristic(this.platform.api.hap.Characteristic.Model, response.device.modelName)
            .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, response.device.id.substring(5))
        }
      } else {
        isOccupied = false
      }
    } catch (err) {
      // this.platform.log.warn(`Could not get powerOn data from 'http://${this.config.ip}:8001/api/v2/'.`);
    }
    this.service.updateCharacteristic(this.platform.api.hap.Characteristic.OccupancyDetected, isOccupied)
    // return the actual result te avoid always off
    return isOccupied
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.
   *
   */
  handleOccupancyDetectedGet() {
    // implement your own code to check if the device is occupied
    const isOccupied = this.isOccupied
    this.platform.log.debug('Get Characteristic OccupancyDetected ->', isOccupied)
    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    return isOccupied
  }
}

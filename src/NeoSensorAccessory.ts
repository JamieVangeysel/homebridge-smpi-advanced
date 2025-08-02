import { PlatformAccessory, CharacteristicGetCallback, Service, Logger } from 'homebridge'
import { HomebridgePlatform, INeoTemperatureSensor } from './platform'

import fetch from 'cross-fetch'

export class NeoSensorAccessory {
  private readonly log: Logger
  private readonly platform: HomebridgePlatform
  private readonly accessory: PlatformAccessory
  private readonly config: INeoTemperatureSensor
  private serviceTemperature: Service
  private serviceHumidity: Service
  private temperature: number
  private humidity: number

  constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: INeoTemperatureSensor) {
    this.platform = platform
    this.accessory = accessory
    this.config = config
    // private loggingService: FakeGatoHistoryService;
    this.temperature = null
    this.humidity = null
    // set accessory information
    platform.log.warn('Setting op NeoSensorAccessory ' + config.name)
    this.accessory.getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Simplintho')
      .setCharacteristic(this.platform.Characteristic.Model, 'Simplintho Neo THP10')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '0.0.0')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, config.uuid.substring(0, 12))
    // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
    // you can create multiple services for each accessory
    this.serviceTemperature = this.accessory.getService(this.platform.Service.TemperatureSensor)
      || this.accessory.addService(this.platform.Service.TemperatureSensor)
    // get the serviceHumidity service if it exists, otherwise create a new serviceHumidity service
    this.serviceHumidity = this.accessory.getService(this.platform.Service.HumiditySensor)
      || this.accessory.addService(this.platform.Service.HumiditySensor)
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.serviceTemperature.setCharacteristic(this.platform.Characteristic.Name, config.name)
    this.serviceHumidity.setCharacteristic(this.platform.Characteristic.Name, config.name)
    this.log = this.platform.log
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
      .on('get', this.handleCurrentTemperatureGet.bind(this))
    // create handlers for required characteristics
    this.serviceHumidity.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .on('get', this.handleCurrentRelativeHumidityGet.bind(this))
    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
    this.updateStatus()
    const update = () => {
      this.updateStatus()
    }
    setInterval(update, 10000)
  }

  updateStatus(): void {
    try {
      fetch(this.fetchUrl).then(async (res) => {
        if (res.status === 200) {
          const response = await res.json()
          if (response.status === 'success') {
            if (response.data.length > 0) {
              this.temperature = response.data[0].temperature
              this.humidity = response.data[0].humidity ?? 0

              this.serviceTemperature.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, (this.heatIndex ?? this.temperature))
              this.serviceHumidity.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.humidity * 100)
              return
            }
          }
          this.platform.log.error('Error updating temperature')

          // this.temperature = temperature ?? 0
          // this.humidity = humidity ?? 0
          // this.loggingService.addEntry({
          //   time: new Date().getTime() / 1000,
          //   temp: this.temperature,
          //   pressure: 1024,
          //   humidity: this.humidity,
          // });
          // this.serviceTemperature.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.temperature)
          // this.serviceHumidity.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.humidity)
        } else {
          this.platform.log.error(`Could not retrieve values from api; [${res.status}]'${this.fetchUrl}'`)
        }
      })
    } catch (err) {
      this.platform.log.error(`Could not get data from '${this.fetchUrl}'.`)
    }
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleCurrentTemperatureGet(callback: CharacteristicGetCallback): void {
    this.platform.log.debug('Triggered GET CurrentTemperature')
    // set this to a valid value for CurrentTemperature
    const currentValue: number = (this.heatIndex ?? this.temperature) ?? 0
    callback(null, currentValue)
  }

  /**
   * Handle requests to get the current value of the "Current Relative Humidity" characteristic
   */
  handleCurrentRelativeHumidityGet(callback: CharacteristicGetCallback): void {
    this.platform.log.debug('Triggered GET CurrentRelativeHumidity')
    // set this to a valid value for CurrentRelativeHumidity
    const currentValue: number = this.humidity ?? 0
    callback(null, currentValue * 100)
  }

  get heatIndex() {
    let result: number = undefined

    if (this.temperature && this.humidity) {
      result = this.calculateHeatIndex(this.temperature, this.humidity)
      // this.platform.log.info(`Successfully calculated heatIndex from values; 'temp: ${this.temperature}, %: ${this.humidity}'. Result: ${result}`)
    }

    return result
  }

  calculateHeatIndex(temperature: number, relativeHumidity: number): number {
    const T: number = (temperature * 1.8) + 32
    const RH: number = relativeHumidity
    let ADJUSTMENT: number = 0
    let HI: number = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094))

    if ((HI + T) / 2 >= 80) {
      HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - .22475541 * T * RH - .00683783 * T * T - .05481717 * RH * RH + .00122874 * T * T * RH + .00085282 * T * RH * RH - .00000199 * T * T * RH * RH

      if (T >= 80 && T <= 112 && RH <= 13) {
        ADJUSTMENT = -1 * (((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95.)) / 17))
      } else if (T >= 80 && T <= 87 && RH >= 85) {
        ADJUSTMENT = ((RH - 85) / 10) * ((87 - T) / 5)
      }
    }

    return ((HI + ADJUSTMENT - 32) / 1.8)
  }

  get fetchUrl(): string {
    return `https://api.jamievangeysel.be/v1/neo/devices/${this.config.uuid}/data`
  }
}

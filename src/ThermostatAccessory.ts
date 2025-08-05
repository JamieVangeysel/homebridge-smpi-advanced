import fetch from 'cross-fetch'
import { HomebridgePlatform, IThermostat } from './platform'
import { PlatformAccessory, Service } from 'homebridge'

export class ThermostatAccessory {
  private readonly platform: HomebridgePlatform
  private readonly accessory: PlatformAccessory
  private readonly config: IThermostat
  private readonly service: Service

  private readonly Characteristic

  constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: IThermostat) {
    this.platform = platform
    this.accessory = accessory
    this.config = config
    this.Characteristic = this.platform.api.hap.Characteristic

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.Characteristic.Manufacturer, 'Jamie Vangeysel')
      .setCharacteristic(this.Characteristic.Model, 'Thermostat')
      .setCharacteristic(this.Characteristic.FirmwareRevision, '1.0')
      .setCharacteristic(this.Characteristic.SerialNumber, 'Unknown')
    // get the Thermostat service if it exists, otherwise create a new Thermostat service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Thermostat)
      || this.accessory.addService(this.platform.Service.Thermostat)
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.Characteristic.Name, config.name)
    this.service.setCharacteristic(this.Characteristic.ConfiguredName, config.name)

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Thermostat
    // create handlers for required characteristics
    this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
      .on('get', this.currentHeatingCoolingStateGet.bind(this))
    this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .on('get', this.targetHeatingCoolingStateGet.bind(this))
      .on('set', this.targetHeatingCoolingStateSet.bind(this))
    this.service.getCharacteristic(this.Characteristic.CurrentTemperature)
      .on('get', this.currentTemperatureGet.bind(this))
    this.service.getCharacteristic(this.Characteristic.TargetTemperature)
      .on('get', this.targetTemperatureGet.bind(this))
      .on('set', this.targetTemperatureSet.bind(this))
      .setProps({
        minValue: 16,
        maxValue: 26,
        minStep: 1
      })
    this.service.getCharacteristic(this.Characteristic.TemperatureDisplayUnits)
      .on('get', this.temperatureDisplayUnitsGet.bind(this))
      .on('set', this.temperatureDisplayUnitsSet.bind(this))
    // this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
    //   .on('get', this.handleCurrentRelativeHumidityGet.bind(this))
  }

  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
  async currentHeatingCoolingStateGet() {
    let result: number = null

    this.platform.log.debug('Triggered GET CurrentHeatingCoolingState')
    const response = await fetch(this.urls.currentState())
    try {
      const res = await response.json()
      result = res.value
    } catch (_a) {
      this.platform.log.error(`Error while parsing data from '${this.urls.currentState()}' to json ${response}.`)
    }

    return result
  }

  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
  async targetHeatingCoolingStateGet() {
    let result: number = null

    this.platform.log.debug('Triggered GET TargetHeatingCoolingState')
    const response = await fetch(this.urls.targetState())
    try {
      const res = await response.json()
      result = res.value
    } catch (_a) {
      this.platform.log.error(`Error while parsing data from '${this.urls.targetState()}' to json ${response}.`)
    }

    return result
  }

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
  async targetHeatingCoolingStateSet(value: number) {
    this.platform.log.debug('Triggered SET TargetHeatingCoolingState:', value)
    // const state: HeatingCoolingStateEnum = value as HeatingCoolingStateEnum;
    await fetch(this.urls.targetState(), {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      //make sure to serialize your JSON body
      body: JSON.stringify({ value })
    })
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  async currentTemperatureGet() {
    let result: number = null

    this.platform.log.debug('Triggered GET CurrentTemperature')
    const response = await fetch(this.urls.currentTemperature())
    try {
      const res = await response.json()
      result = res.value
    } catch (_a) {
      this.platform.log.error(`Error while parsing data from '${this.urls.currentTemperature()}' to json ${response}.`)
    }

    return result
  }

  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  async targetTemperatureGet() {
    let result: number = null

    this.platform.log.debug('Triggered GET TargetTemperature')
    const response = await fetch(this.urls.targetTemperature())
    try {
      const res = await response.json()
      result = res.value
    } catch (_a) {
      this.platform.log.error(`Error while parsing data from '${this.urls.targetTemperature()}' to json ${response}.`)
    }

    return result
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  async targetTemperatureSet(value: number) {
    this.platform.log.debug('Triggered SET TargetTemperature:', value)
    // const temperature: number = value as number;
    await fetch(this.urls.targetTemperature(), {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      //make sure to serialize your JSON body
      body: JSON.stringify({ value })
    })
    return
  }

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
  temperatureDisplayUnitsGet() {
    this.platform.log.debug('Triggered GET TemperatureDisplayUnits')
    // set this to a valid value for TemperatureDisplayUnits
    // const currentValue: TemperatureDisplayUnits = this.state.temperatureDisplayUnits;
    return TemperatureDisplayUnits.CELSIUS
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  temperatureDisplayUnitsSet(value: number) {
    this.platform.log.debug('Triggered SET TemperatureDisplayUnits:', value)
    // const displayUnit: TemperatureDisplayUnits = value as TemperatureDisplayUnits;
    // this.state.temperatureDisplayUnits = displayUnit;
    return
  }

  currentRelativeHumidityGet() {
    this.platform.log.debug('Triggered GET CurrentRelativeHumidity:')

    return 0
  }

  get urls(): any {
    const baseUrl: string = `http://${this.config.host}:${this.config.port ?? 8080}/${this.config.instance ?? 'default'}`
    return {
      currentTemperature: () => `${baseUrl}/current-temperature`,
      targetTemperature: () => `${baseUrl}/target-temperature`,
      currentState: () => `${baseUrl}/current-state`,
      targetState: () => `${baseUrl}/target-state`
    }
  }
}

export enum HeatingCoolingStateEnum {
  OFF = 0,
  HEAT = 1,
  COOL = 2,
  AUTO = 3
}

export enum TemperatureDisplayUnits {
  CELSIUS = 0,
  FAHRENHEIT = 1
}

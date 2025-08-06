import fetch from 'cross-fetch'
import { HomebridgePlatform, IThermostat } from './platform'
import { CharacteristicGetCallback, CharacteristicValue, PlatformAccessory, Service } from 'homebridge'

export class ThermostatAccessory {
  private readonly platform: HomebridgePlatform
  private readonly accessory: PlatformAccessory
  private readonly config: IThermostat
  private readonly service: Service

  private readonly Characteristic

  private readonly serviceHeatingValve
  private readonly serviceWaterValve
  private readonly serviceHeatingOutlet

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
      .onGet(this.currentHeatingCoolingStateGet.bind(this))
    this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .onGet(this.targetHeatingCoolingStateGet.bind(this))
      .onSet(this.targetHeatingCoolingStateSet.bind(this))
    this.service.getCharacteristic(this.Characteristic.CurrentTemperature)
      .onGet(this.currentTemperatureGet.bind(this))
    this.service.getCharacteristic(this.Characteristic.TargetTemperature)
      .onGet(this.targetTemperatureGet.bind(this))
      .onSet(this.targetTemperatureSet.bind(this))
      .setProps({
        minValue: 16,
        maxValue: 24,
        minStep: .5
      })
    this.service.getCharacteristic(this.Characteristic.TemperatureDisplayUnits)
      .onGet(this.temperatureDisplayUnitsGet.bind(this))
      .onSet(this.temperatureDisplayUnitsSet.bind(this))
    this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
      .onGet(this.currentRelativeHumidityGet.bind(this))

    if (config.valves) {
      const heatingValve = config.valves.find(e => e.id === 'heating-valve')
      this.serviceHeatingValve = this.accessory.getService(heatingValve.name) || this.accessory.addService(this.platform.Service.Valve, heatingValve.name, heatingValve.name + '-valve')
      this.serviceHeatingValve
        .setCharacteristic(this.platform.api.hap.Characteristic.Name, heatingValve.name)
        .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, heatingValve.name)
      this.serviceHeatingValve
        .getCharacteristic(this.platform.api.hap.Characteristic.Active)
        .onGet(this.heatingValveActiveGet.bind(this))
        .onSet((value) => {
          this.platform.log.debug('Triggered SET Active:', value)
        })
      this.serviceHeatingValve.getCharacteristic(this.Characteristic.InUse)
        .onGet(() => this.Characteristic.InUse.NOT_IN_USE)
      this.serviceHeatingValve.getCharacteristic(this.Characteristic.ValveType)
        .onGet(() => this.Characteristic.ValveType.GENERIC_VALVE)

      const waterValve = config.valves.find(e => e.id === 'water-valve')
      this.serviceWaterValve = this.accessory.getService(waterValve.name) || this.accessory.addService(this.platform.Service.Valve, waterValve.name, waterValve.name + '-valve')
      this.serviceWaterValve
        .setCharacteristic(this.platform.api.hap.Characteristic.Name, waterValve.name)
        .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, waterValve.name)
      this.serviceWaterValve
        .getCharacteristic(this.platform.api.hap.Characteristic.Active)
        .onGet(this.waterValveActiveGet.bind(this))
        .onSet(this.waterValveActiveSet.bind(this))
      this.serviceWaterValve.getCharacteristic(this.Characteristic.InUse)
        .onGet(() => this.Characteristic.InUse.NOT_IN_USE)
      this.serviceWaterValve.getCharacteristic(this.Characteristic.ValveType)
        .onGet(() => this.Characteristic.ValveType.GENERIC_VALVE)
    }

    if (config.outlets) {
      const heatingElementOutlet = config.outlets.find(e => e.id === 'heating-element')
      this.serviceHeatingOutlet = this.accessory.getService(heatingElementOutlet.name) || this.accessory.addService(this.platform.Service.Outlet, heatingElementOutlet.name, heatingElementOutlet.name + '-outlet')
      this.serviceHeatingOutlet
        .setCharacteristic(this.platform.api.hap.Characteristic.Name, heatingElementOutlet.name)
        .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, heatingElementOutlet.name)
      this.serviceHeatingOutlet
        .getCharacteristic(this.platform.api.hap.Characteristic.On)
        .onGet(this.heatingOutletOnGet.bind(this))
        .onSet((value) => {
          this.platform.log.debug('Triggered SET On:', value)
        })
    }
  }

  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
  async currentHeatingCoolingStateGet(): Promise<number | Error> {
    this.platform.log.debug('Triggered GET CurrentHeatingCoolingState')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.currentState())
      const res = await response.json()
      value = res.value
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.currentState()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
  }

  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
  async targetHeatingCoolingStateGet() {
    this.platform.log.debug('Triggered GET TargetHeatingCoolingState')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.targetState())
      const res = await response.json()
      value = res.value
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.targetState()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
  }

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
  async targetHeatingCoolingStateSet(value: CharacteristicValue) {
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
  async currentTemperatureGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET CurrentTemperature')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.currentTemperature())
      const res = await response.json()
      value = res.value
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.currentTemperature()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
  }

  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  async targetTemperatureGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET TargetTemperature')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.targetTemperature())
      const res = await response.json()
      value = res.value
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.targetTemperature()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
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

  async currentRelativeHumidityGet() {
    this.platform.log.debug('Triggered GET RelativeHumidity')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.currentRelativeHumidity())
      const res = await response.json()
      value = res.value * 100
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.currentRelativeHumidity()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
  }

  async heatingValveActiveGet() {
    this.platform.log.debug('Triggered GET RelativeHumidity')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.heatingValveActive())
      const res = await response.json()
      value = res.value
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.heatingValveActive()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
  }

  async waterValveActiveGet() {
    this.platform.log.debug('Triggered GET WaterValve Active')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.waterValveActive())
      const res = await response.json()
      value = res.value
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.waterValveActive()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  async waterValveActiveSet(value: number) {
    this.platform.log.debug('Triggered SET WaterValve Active:', value)
    // const temperature: number = value as number
    await fetch(this.urls.waterValveActive(), {
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

  async heatingOutletOnGet() {
    this.platform.log.debug('Triggered GET HeatingOutlet On')
    let value: number | Error = null

    try {
      const response = await fetch(this.urls.heatingElementOn())
      const res = await response.json()
      value = res.value
    } catch (_a) {
      this.platform.log.error(`Error while retrieving data from '${this.urls.heatingElementOn()}'.`)
      value = new Error('Error while getting data from thermostat')
    }

    return value
  }

  get urls(): any {
    const baseUrl: string = `http://${this.config.host}:${this.config.port ?? 8080}/${this.config.instance ?? 'default'}`
    return {
      currentTemperature: (): string => `${baseUrl}/current-temperature`,
      targetTemperature: (): string => `${baseUrl}/target-temperature`,
      currentRelativeHumidity: (): string => `${baseUrl}/current-relative-humidity`,
      currentState: (): string => `${baseUrl}/current-state`,
      targetState: (): string => `${baseUrl}/target-state`,
      heatingValveActive: (): string => `${baseUrl}/heating-valve/active`,
      waterValveActive: (): string => `${baseUrl}/water-valve/active`,
      heatingElementOn: (): string => `${baseUrl}/heating-element/on`
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

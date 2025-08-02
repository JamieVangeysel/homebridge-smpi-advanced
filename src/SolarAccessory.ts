import { PlatformAccessory, CharacteristicGetCallback, Service, Logger, CharacteristicValue } from 'homebridge'
import { HomebridgePlatform, INeoTemperatureSensor } from './platform'

import fetch from 'cross-fetch'

const LAT = 50.893280
const LNG = 5.318499

const SHORT_SPREAD: number = 10 * 1000
const TIME_SPREAD: number = 15 * 60 * 1000
const LONG_SPREAD: number = 45 * 60 * 1000

export class SolarAccessory {
  private readonly platform: HomebridgePlatform
  private readonly accessory: PlatformAccessory
  // private readonly config: INeoTemperatureSensor

  private currentTime: number = 0

  private service: Service

  private serviceSunrise: Service
  private serviceSunset: Service
  private serviceNoon: Service
  private serviceGoldenHour: Service
  private serviceDawn: Service
  private serviceDusk: Service

  private isSunrise: boolean = undefined
  private isSunset: boolean = undefined
  private isNoon: boolean = undefined
  private isGoldenHour: boolean = undefined
  private isDawn: boolean = undefined
  private isDusk: boolean = undefined

  private api_values: IApiResponse = undefined

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: true,
    Brightness: 100
  }

  constructor(platform: HomebridgePlatform, accessory: PlatformAccessory) { // , config: INeoTemperatureSensor
    this.platform = platform
    this.accessory = accessory
    // this.config = config

    // set accessory information
    platform.log.info('Setting op SolarAccessory')
    this.accessory.getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SunriseSunset.io')
      .setCharacteristic(this.platform.Characteristic.Model, 'Solar information')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '1.0.0')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'SERIAL NUMBER')

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb)

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'SunriseSunset')

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)) // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    // this.service.getCharacteristic(this.platform.Characteristic.Brightness)
    //   .onSet(this.setBrightness.bind(this)) // SET - bind to the `setBrightness` method below

    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same subtype id.)
     */
    // temp fix for old version
    // this.accessory.removeService(this.accessory.getService('Sunrise'))
    // this.accessory.removeService(this.accessory.getService('Sunset'))

    this.serviceSunrise = this.accessory.getService('Sunrise')
      || this.accessory.addService(this.platform.Service.MotionSensor, 'Sunrise', 'Sunrise-motion')
    this.serviceSunset = this.accessory.getService('Sunset')
      || this.accessory.addService(this.platform.Service.MotionSensor, 'Sunset', 'Sunset-motion')
    this.serviceNoon = this.accessory.getService('Noon')
      || this.accessory.addService(this.platform.Service.MotionSensor, 'Noon', 'Noon-motion')
    this.serviceGoldenHour = this.accessory.getService('GoldenHour')
      || this.accessory.addService(this.platform.Service.MotionSensor, 'GoldenHour', 'GoldenHour-motion')
    this.serviceDawn = this.accessory.getService('Dawn')
      || this.accessory.addService(this.platform.Service.MotionSensor, 'Dawn', 'Dawn-motion')
    this.serviceDusk = this.accessory.getService('Dusk')
      || this.accessory.addService(this.platform.Service.MotionSensor, 'Dusk', 'Dusk-motion')

    this.serviceSunrise
      .setCharacteristic(this.platform.Characteristic.Name, 'Sunrise')
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Sunrise')
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.handleSunriseMotionDetectedGet.bind(this))
    this.serviceSunset
      .setCharacteristic(this.platform.Characteristic.Name, 'Sunset')
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Sunset')
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.handleSunsetMotionDetectedGet.bind(this))

    this.serviceNoon
      .setCharacteristic(this.platform.Characteristic.Name, 'Noon')
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Noon')
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.handleNoonMotionDetectedGet.bind(this))

    this.serviceGoldenHour
      .setCharacteristic(this.platform.Characteristic.Name, 'GoldenHour')
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'GoldenHour')
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.handleGoldenHourMotionDetectedGet.bind(this))

    this.serviceDawn
      .setCharacteristic(this.platform.Characteristic.Name, 'Dawn')
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Dawn')
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.handleDawnMotionDetectedGet.bind(this))

    this.serviceDusk
      .setCharacteristic(this.platform.Characteristic.Name, 'Dusk')
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Dusk')
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.handleDuskMotionDetectedGet.bind(this))


    this.loadApiValues()

    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
    const update = () => {
      this.update()
    }
    setTimeout(update, 1000)
  }

  loadApiValues(): void {
    if (this.exampleStates.On) {
      fetch(this.apiUrl)
        .then(async (res) => {
          if (res.status === 200) {
            this.platform.log.success(`loadApiValues() -- Received status OK from api.sunrisesunset.io`)

            const response = await res.json()
            if (response.results) {
              this.api_values = response.results as IApiResponse
            }
            this.update()
          }
        })
        .catch(error => {
          this.platform.log.error('loadApiValues() -- error', error)
        })
    }
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.exampleStates.On = value as boolean

    this.platform.log.debug('Set Characteristic On ->', value)
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
   * In this case, you may decide not to implement `onGet` handlers, which may speed up
   * the responsiveness of your device in the Home app.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.exampleStates.On

    this.platform.log.debug('Get Characteristic On ->', isOn)

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn
  }

  // update sensors based on API result
  update(): void {
    this.currentTime = new Date().getTime()

    if (this.exampleStates.On) {
      // this.platform.log.debug('SolarAccessory.update()')
      if (this.api_values) {
        if (this.api_values.date !== new Date().toISOString().substring(0, 10)) {
          this.platform.log.info('Date has changed, request new info from api!')
        }
        this.checkSunrise()
        this.checkSunset()
        this.checkNoon()
        this.checkGoldenHour()
        this.checkDawn()
        this.checkDusk()
        // this.serviceSunrise.setCharacteristic()
      } else {
        this.platform.log.error('SolarAccessory.update() -- api_values is undefined!')
      }
    } else {
      this.platform.log.info('SolarAccessory.update() -- disabled')
    }
  }

  checkSunrise() {
    let local = this.isSunrise
    let detected = this.sunriseDetected

    if (local === undefined) {
      local = detected
    }

    if (local !== detected) {
      this.platform.log.info('Sunrise Detected')
      this.serviceSunrise.setCharacteristic(this.platform.Characteristic.MotionDetected, detected ? 1 : 0)
      local = detected
    }

    this.isSunrise = local
  }

  checkSunset() {
    let local = this.isSunset
    let detected = this.sunsetDetected

    if (local === undefined) {
      local = detected
    }

    if (local !== detected) {
      this.platform.log.info('Sunset Detected')
      this.serviceSunset.setCharacteristic(this.platform.Characteristic.MotionDetected, detected ? 1 : 0)
      local = detected
    }

    this.isSunset = local
  }

  checkNoon() {
    let local = this.isNoon
    let detected = this.noonDetected

    if (local === undefined) {
      local = detected
    }

    if (local !== detected) {
      this.platform.log.info('Noon Detected')
      this.serviceNoon.setCharacteristic(this.platform.Characteristic.MotionDetected, detected ? 1 : 0)
      local = detected
    }

    this.isNoon = local
  }

  checkGoldenHour() {
    let local = this.isGoldenHour
    let detected = this.goldenHourDetected

    if (local === undefined) {
      local = detected
    }

    if (local !== detected) {
      this.platform.log.info('GoldenHour Detected')
      this.serviceGoldenHour.setCharacteristic(this.platform.Characteristic.MotionDetected, detected ? 1 : 0)
      local = detected
    }

    this.isGoldenHour = local
  }

  checkDawn() {
    let local = this.isDawn
    let detected = this.dawnDetected

    if (local === undefined) {
      local = detected
    }

    if (local !== detected) {
      this.platform.log.info('Dawn Detected')
      this.serviceDawn.setCharacteristic(this.platform.Characteristic.MotionDetected, detected ? 1 : 0)
      local = detected
    }

    this.isDawn = local
  }

  checkDusk() {
    let local = this.isDusk
    let detected = this.duskDetected

    if (local === undefined) {
      local = detected
    }

    if (local !== detected) {
      this.platform.log.info('Dusk Detected')
      this.serviceDusk.setCharacteristic(this.platform.Characteristic.MotionDetected, detected ? 1 : 0)
      local = detected
    }

    this.isDusk = local
  }

  handleSunriseMotionDetectedGet() {
    return this.isSunrise ? 1 : 0
  }

  handleSunsetMotionDetectedGet() {
    return this.isSunset ? 1 : 0
  }

  handleNoonMotionDetectedGet() {
    return this.isNoon ? 1 : 0
  }

  handleGoldenHourMotionDetectedGet() {
    return this.isGoldenHour ? 1 : 0
  }

  handleDawnMotionDetectedGet() {
    return this.isDawn ? 1 : 0
  }

  handleDuskMotionDetectedGet() {
    return this.isDusk ? 1 : 0
  }

  get sunriseDetected(): boolean {
    let detected: boolean = false

    if (this.exampleStates.On) {
      const time: number = new Date(`${this.api_values.date}T${this.api_values.sunrise}.000`).getTime()

      detected = this.currentTime > time - SHORT_SPREAD && this.currentTime < time + SHORT_SPREAD
      this.platform.log.info(`sunriseDetected() -- ${detected}`)
    }

    return detected
  }

  get sunsetDetected(): boolean {
    let detected: boolean = false

    if (this.exampleStates.On) {
      const time: number = new Date(`${this.api_values.date}T${this.api_values.sunset}.000`).getTime()

      detected = this.currentTime > time - SHORT_SPREAD && this.currentTime < time + SHORT_SPREAD
      this.platform.log.info(`sunsetDetected() -- ${detected}`)
    }

    return detected
  }

  get noonDetected(): boolean {
    let detected: boolean = false

    if (this.exampleStates.On) {
      const time: number = new Date(`${this.api_values.date}T${this.api_values.solar_noon}.000`).getTime()

      detected = this.currentTime > time - LONG_SPREAD && this.currentTime < time + LONG_SPREAD
      this.platform.log.info(`noonDetected() -- ${detected}`)
    }

    return detected
  }

  get goldenHourDetected(): boolean {
    let detected: boolean = false

    if (this.exampleStates.On) {
      const time: number = new Date(`${this.api_values.date}T${this.api_values.golden_hour}.000`).getTime()

      detected = this.currentTime > time - TIME_SPREAD && this.currentTime < time + TIME_SPREAD
      this.platform.log.info(`goldenHourDetected() -- ${detected}`)
    }

    return detected
  }

  get dawnDetected(): boolean {
    let detected: boolean = false

    if (this.exampleStates.On) {
      const time: number = new Date(`${this.api_values.date}T${this.api_values.dawn}.000`).getTime()

      detected = this.currentTime > time - TIME_SPREAD && this.currentTime < time + TIME_SPREAD
      this.platform.log.info(`dawnDetected() --  ${detected}`)
    }

    return detected
  }

  get duskDetected(): boolean {
    let detected: boolean = false

    if (this.exampleStates.On) {
      const time: number = new Date(`${this.api_values.date}T${this.api_values.dusk}.000`).getTime()

      detected = this.currentTime > time - TIME_SPREAD && this.currentTime < time + TIME_SPREAD
      this.platform.log.info(`duskDetected() --  ${detected}`)
    }

    return detected
  }

  get apiUrl() {
    return `https://api.sunrisesunset.io/json?lat=${LAT}&lng=${LNG}&timezone=CET&time_format=24`
  }
}

interface IApiResponse {
  date: string
  sunrise: string
  sunset: string
  first_light: string
  last_light: string
  dawn: string
  dusk: string
  solar_noon: string
  golden_hour: string
  day_length: string
}

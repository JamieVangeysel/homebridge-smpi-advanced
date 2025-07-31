import { PlatformAccessory, CharacteristicGetCallback } from 'homebridge';
import { HomebridgePlatform, INeoTemperatureSensor } from './platform';
export declare class NeoSensorAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly config;
    private serviceTemperature;
    private serviceHumidity;
    private temperature;
    private humidity;
    constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: INeoTemperatureSensor);
    updateStatus(): Promise<void>;
    /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
    handleCurrentTemperatureGet(callback: CharacteristicGetCallback): void;
    /**
     * Handle requests to get the current value of the "Current Relative Humidity" characteristic
     */
    handleCurrentRelativeHumidityGet(callback: CharacteristicGetCallback): void;
    private get url();
}
//# sourceMappingURL=NeoSensorAccessory.d.ts.map
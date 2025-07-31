import { PlatformAccessory, CharacteristicGetCallback, CharacteristicSetCallback } from 'homebridge';
import { HomebridgePlatform, INeoThermostat } from './platform';
export declare class NeoThermostatAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly config;
    private service;
    constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: INeoThermostat);
    /**
     * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
     */
    handleCurrentHeatingCoolingStateGet(callback: CharacteristicGetCallback): Promise<void>;
    /**
     * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
     */
    handleTargetHeatingCoolingStateGet(callback: CharacteristicGetCallback): Promise<void>;
    /**
     * Handle requests to set the "Target Heating Cooling State" characteristic
     */
    handleTargetHeatingCoolingStateSet(value: unknown, callback: CharacteristicSetCallback): Promise<void>;
    /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
    handleCurrentTemperatureGet(callback: CharacteristicGetCallback): Promise<void>;
    /**
     * Handle requests to get the current value of the "Target Temperature" characteristic
     */
    handleTargetTemperatureGet(callback: CharacteristicGetCallback): Promise<void>;
    /**
     * Handle requests to set the "Target Temperature" characteristic
     */
    handleTargetTemperatureSet(value: unknown, callback: CharacteristicSetCallback): Promise<void>;
    /**
     * Handle requests to get the current value of the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsGet(callback: CharacteristicGetCallback): void;
    /**
     * Handle requests to set the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsSet(value: unknown, callback: CharacteristicSetCallback): void;
    private get url();
}
//# sourceMappingURL=NeoThermostatAccessory.d.ts.map
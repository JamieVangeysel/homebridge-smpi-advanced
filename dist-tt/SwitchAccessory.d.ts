import { PlatformAccessory, CharacteristicGetCallback, CharacteristicSetCallback } from 'homebridge';
import { HomebridgePlatform, IPlug } from './platform';
export declare class SwitchAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly config;
    private service;
    constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: IPlug);
    initializeStatus(): void;
    /**
     * Handle requests to get the current value of the "On" characteristic
     */
    handleOnGet(callback: CharacteristicGetCallback): Promise<void>;
    /**
     * Handle requests to set the "On" characteristic
     */
    handleOnSet(value: unknown, callback: CharacteristicSetCallback): Promise<void>;
}
//# sourceMappingURL=SwitchAccessory.d.ts.map
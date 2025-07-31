/// <reference types="node" />
import { PlatformAccessory, CharacteristicGetCallback } from 'homebridge';
import { HomebridgePlatform, IPresenceDetector } from './platform';
export declare class TizenPresenceAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly config;
    private service;
    /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
    private isOccupied;
    myTimer: NodeJS.Timeout;
    constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: IPresenceDetector);
    updateStatus(updateInfo?: boolean): Promise<boolean>;
    /**
     * Handle the "GET" requests from HomeKit
     * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * If your device takes time to respond you should update the status of your device
     * asynchronously instead using the `updateCharacteristic` method instead.
     *
     */
    handleOccupancyDetectedGet(callback: CharacteristicGetCallback): void;
}
//# sourceMappingURL=TizenPresenceAccessory.d.ts.map
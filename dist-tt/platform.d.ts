import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export declare class HomebridgePlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    foundAccessoires: string[];
    constructor(log: Logger, config: PlatformConfig, api: API);
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): void;
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices(): void;
}
export interface IPlatformConfig extends Record<string, unknown> {
    platform: string;
    name?: string;
    presenceDetectors: IPresenceDetector[];
    motionDetectors: IMotionDetector[];
    neoSensors: INeoTemperatureSensor[];
    thermostats: INeoThermostat[];
    switches: IPlug[];
    securitySystems: ISecuritySystem[];
}
export interface IPresenceDetector {
    ip: string;
    name: string;
    type: 'Samsung SmartTV';
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
export interface INeoThermostat {
    name: string;
    uuid: string;
    ip: string;
}
export interface IPlug {
    name: string;
    type: 'ip' | 'http' | 'statefull';
    ip?: string;
    onUrl?: string;
    offUrl?: string;
    stateUrl?: string;
    custom?: boolean;
    definition: IDayOfTheWeekDefinition | IDayOfTheWeekGroupDefinition;
}
export interface IDayOfTheWeekDefinition {
    type: 'dayOfTheWeek';
    day: number;
}
export interface IDayOfTheWeekGroupDefinition {
    type: 'dayOfTheWeekGroup';
    days: number[];
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
//# sourceMappingURL=platform.d.ts.map
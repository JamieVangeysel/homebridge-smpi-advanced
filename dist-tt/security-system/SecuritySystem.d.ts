import { PlatformAccessory, CharacteristicGetCallback, CharacteristicSetCallback } from "homebridge";
import { HomebridgePlatform, ISecuritySystem } from "../platform";
export declare class SecuritySystem {
    private readonly platform;
    private readonly accessory;
    private readonly config;
    private alarmService;
    private currentState;
    private targetState;
    constructor(platform: HomebridgePlatform, accessory: PlatformAccessory, config: ISecuritySystem);
    /**
     * Handle requests to get the current value of the "Security System Current State" characteristic
     */
    handleSecuritySystemCurrentStateGet(callback: CharacteristicGetCallback): void;
    /**
     * Handle requests to get the current value of the "Security System Target State" characteristic
     */
    handleSecuritySystemTargetStateGet(callback: CharacteristicGetCallback): void;
    /**
     * Handle requests to set the "Security System Target State" characteristic
     */
    handleSecuritySystemTargetStateSet(value: unknown, callback: CharacteristicSetCallback): void;
}
export declare enum SecuritySystemCurrentState {
    STAY_ARM = 0,
    AWAY_ARM = 1,
    NIGHT_ARM = 2,
    DISARMED = 3,
    ALARM_TRIGGERED = 4
}
export declare enum SecuritySystemTargetState {
    STAY_ARM = 0,
    AWAY_ARM = 1,
    NIGHT_ARM = 2,
    DISARM = 3
}
//# sourceMappingURL=SecuritySystem.d.ts.map
/**
 * XinaBox SL06 extension for makecode
 */
/**
 * SL06 block
 */
//% color=#444444 icon="\uf0eb"
//% groups=[Colour,Light, Gesture, Proximity, Optional]
namespace SL06 {

    let DIR_NONE = 'none'
    let DIR_LEFT = 'left'
    let DIR_RIGHT = 'right'
    let DIR_UP = 'up'
    let DIR_DOWN = 'down'
    let DIR_NEAR = 'near'
    let DIR_FAR = 'far'
    let DIR_ALL = 'all'

    enum states {
        NA_STATE1,
        NEAR_STATE1,
        FAR_STATE1,
        ALL_STATE1
    };

    let APDS9960_I2C_ADDR = 0x39;
    let APDS9960_ID_1 = 0xAB
    let APDS9960_ID_2 = 0X9c

    let gesture_data_u_data = pins.createBuffer(32);
    let gesture_data_d_data = pins.createBuffer(32);
    let gesture_data_l_data = pins.createBuffer(32);
    let gesture_data_r_data = pins.createBuffer(32);
    let gesture_data_index: NumberFormat.UInt8BE
    let gesture_data_total_gestures: NumberFormat.UInt8BE;
    let gesture_data_in_threshold: NumberFormat.UInt8BE;
    let gesture_data_out_threshold: NumberFormat.UInt8BE;

    let gesture_ud_delta_ = 0;
    let gesture_lr_delta_ = 0;

    let gesture_ud_count_ = 0;
    let gesture_lr_count_ = 0;

    let gesture_near_count_ = 0;
    let gesture_far_count_ = 0;

    let gesture_state_ = 0;
    let gesture_motion_ = DIR_NONE;

    export enum light_unit {
        //% block="LUX"
        LUX = 1,
        //% block="FC"
        FC = 2
    }

    //%blockId=SL06_begin
    //%block="SL06 begin"
    //%advanced=true
    //%group=Optional
    function begin(): void {
        let id: number
        id = wireReadDataByte(APDS9960_I2C_ADDR)

        /* Set ENABLE register to 0 (disable all features) */
        // ALL, OFF
        setMode(7, 0)

        /* Set default values for ambient light and proximity registers */
        // APDS9960_ATIME, DEFAULT_ATIME
        wireWriteDataByte(0x81, 219)

        // APDS9960_WTIME, DEFAULT_WTIME
        wireWriteDataByte(0x83, 246)

        //APDS9960_PPULSE, DEFAULT_PROX_PPULSE
        wireWriteDataByte(0x8E, 0x87)

        // APDS9960_POFFSET_UR, DEFAULT_POFFSET_UR
        wireWriteDataByte(0x9D, 0)

        // APDS9960_POFFSET_DL, DEFAULT_POFFSET_DL
        wireWriteDataByte(0x9E, 0)

        // APDS9960_CONFIG1, DEFAULT_CONFIG1
        wireWriteDataByte(0x8D, 0x60)

        // DEFAULT_LDRIVE
        setLEDDrive(0)

        // DEFAULT_PGAIN
        setProximityGain(2)

        // DEFAULT_AGAIN
        setAmbientLightGain(0)

        // DEFAULT_PILT
        setProxIntLowThresh(0)

        // DEFAULT_PIHT
        setProxIntHighThresh(50)

        // DEFAULT_AILT
        setLightIntLowThreshold(0xFFFF)

        // DEFAULT_AIHT
        setLightIntHighThreshold(0)

        // APDS9960_PERS, DEFAULT_PERS
        wireWriteDataByte(0x8C, 0x11)

        // APDS9960_CONFIG2, DEFAULT_CONFIG2
        wireWriteDataByte(0x90, 0x01)

        // APDS9960_CONFIG3, DEFAULT_CONFIG3
        wireWriteDataByte(0x9F, 0)

        // DEFAULT_GPENTH
        setGestureEnterThresh(40)

        // DEFAULT_GEXTH
        setGestureExitThresh(30)

        // APDS9960_GCONF1, DEFAULT_GCONF1
        wireWriteDataByte(0xA2, 0x40)

        // DEFAULT_GGAIN
        setGestureGain(2)

        // DEFAULT_GLDRIVE
        setGestureLEDDrive(0)

        // DEFAULT_GWTIME
        setGestureWaitTime(1)

        // APDS9960_GOFFSET_U, DEFAULT_GOFFSET
        wireWriteDataByte(0xA4, 0)

        // APDS9960_GOFFSET_D, DEFAULT_GOFFSET
        wireWriteDataByte(0xA5, 0)

        // APDS9960_GOFFSET_L, DEFAULT_GOFFSET
        wireWriteDataByte(0xA7, 0)

        // APDS9960_GOFFSET_R, DEFAULT_GOFFSET
        wireWriteDataByte(0xA9, 0)

        // APDS9960_GPULSE, DEFAULT_GPULSE
        wireWriteDataByte(0xA6, 0xC9)

        // APDS9960_GCONF3, DEFAULT_GCONF3
        wireWriteDataByte(0xAA, 0)

        // DEFAULT_GIEN
        setGestureIntEnable(0)

    }

    //%blockId=SL06_getMode
    //%block="SL06 get mode"
    //%advanced=true
    //%group=Optional
    function getMode(): number {
        let enable_value: number;

        /* Read current ENABLE register */
        // APDS9960_ENABLE
        enable_value = wireReadDataByte(0x80)

        return enable_value;
    }

    //%blockId=SL06_setMode
    //%block="SL06 set mode %mode %enable"
    //%advanced=true
    //%group=Optional
    function setMode(mode: NumberFormat.UInt8BE, enable: NumberFormat.UInt8BE): boolean {
        let reg_val: NumberFormat.UInt8BE;

        /* Read current ENABLE register */
        reg_val = getMode();
        // ERROR value
        if (reg_val == 0xFF) {
            return false;
        }

        /* Change bit(s) in ENABLE register */
        enable = enable & 0x01;
        if (mode >= 0 && mode <= 6) {
            if (enable) {
                reg_val |= (1 << mode);
            }
            else {
                reg_val &= ~(1 << mode);
            }
        }
        // ALL mode
        else if (mode == 7) {
            if (enable) {
                reg_val = 0x7F;
            }
            else {
                reg_val = 0x00;
            }
        }

        /* Write value back to ENABLE register */
        // APDS9960_ENABLE
        wireWriteDataByte(0x80, reg_val)

        return true;
    }


    //%blockId=SL06_enablePower
    //%block="SL06 enable power"
    //%group=Optional
    function enablePower() {
        setMode(0, 1)
    }

    //%blockId=SL06_disablePower
    //%block="SL06 disable power"
    //%group=Optional
    function disbalePower() {
        setMode(0, 0)
    }

    //%blockId=SL06_enableGestureSensor
    //%block="SL06 enable gesture sensor"
    //% interrupts.defl=false
    //%group=Gesture
    export function enableGestureSensor(): void {

        /* Enable gesture mode
           Set ENABLE to 0 (power off)
           Set WTIME to 0xFF
           Set AUX to LED_BOOST_300
           Enable PON, WEN, PEN, GEN in ENABLE 
        */
        resetGestureParameters();

        wireWriteDataByte(0x83, 0xFF)

        //APDS9960_PPULSE, DEFAULT_GESTURE_PPULSE
        wireWriteDataByte(0x8E, 0x89)

        // LED_BOOST_300
        setLEDBoost(3)

        setGestureIntEnable(0)

        setGestureMode(1)

        enablePower()

        // WAIT
        setMode(3, 1)

        // PROXIMITY
        setMode(2, 1)

        // GESTURE
        setMode(6, 1)
    }

    //%blockId=SL06_disableGestureSensor
    //%block="SL06 disable gesture sensor"
    //%group=Gesture
    export function disableGestureSensor() {
        resetGestureParameters();
        setGestureIntEnable(0)

        setGestureMode(0)

        setMode(6, 0)

    }

    //%blockId=SL06_getLEDDRive
    //%block="SL06 get LED drive"
    //%advanced=true
    //%group=Optional
    function getLEDDrive() {
        let val: number;

        /* Read value from CONTROL register */
        // APDS9960_CONTROL
        val = wireReadDataByte(0x8F)

        /* Shift and mask out LED drive bits */
        val = (val >> 6) & 0b00000011;

        return val;
    }

    //%blockId=SL06_setLEDDRive
    //%block="SL06 set LED drive %drive"
    //%advanced=true
    //%group=Optional
    function setLEDDrive(drive: NumberFormat.UInt8BE): void {
        let val: NumberFormat.UInt8BE = 0;

        /* Read value from CONTROL register */
        // APDS9960_CONTROL
        val = wireReadDataByte(0x8F)

        /* Set bits in register to given value */
        drive &= 0b00000011;
        drive = drive << 6;
        val &= 0b00111111;
        val |= drive;

        /* Write register value back into CONTROL register */
        // APDS9960_CONTROL, val
        wireWriteDataByte(0x8F, val)

    }

    //%blockId=SL06_getGestureLEDDrive
    //%block="SL06 get gesture LED drive"
    //%advanced=true
    //%group=Gesture
    function getGestureLEDDrive() {
        let val: number;

        /* Read value from GCONF2 register */
        // APDS9960_GCONF2
        val = wireReadDataByte(0xA3)

        /* Shift and mask out GLDRIVE bits */
        val = (val >> 3) & 0b00000011;

        return val;
    }

    //%blockId=SL06_setGestureLEDDrive
    //%block="SL06 set gesture LED drive %drive"
    //%group=Gesture
    //%advanced=true
    function setGestureLEDDrive(drive: number) {
        let val: number;

        /* Read value from GCONF2 register */
        // APDS9960_GCONF2
        val = wireReadDataByte(0xA3)
        /* Set bits in register to given value */
        drive &= 0b00000011;
        drive = drive << 3;
        val &= 0b11100111;
        val |= drive;

        /* Write register value back into GCONF2 register */
        // APDS9960_GCONF2
        wireWriteDataByte(0xA3, val)
            ;
    }

    //%blockId=SL06_getGestureGain
    //%block="SL06 get gesture gain"
    //%advanced=true
    //%group=Gesture
    function getGestureGain() {
        let val: number;

        /* Read value from GCONF2 register */
        // APDS9960_GCONF2
        val = wireReadDataByte(0xA3)

        /* Shift and mask out GGAIN bits */
        val = (val >> 5) & 0b00000011;

        return val;
    }

    //%blockId=SL06_setGestureGain
    //%block="SL06 set gesture gain %gain"
    //%advanced=true
    //%group=Gesture
    function setGestureGain(gain: number) {
        let val: number;

        /* Read value from GCONF2 register */
        // APDS9960_GCONF2
        val = wireReadDataByte(0xA3)

        /* Set bits in register to given value */
        gain &= 0b00000011;
        gain = gain << 5;
        val &= 0b10011111;
        val |= gain;

        /* Write register value back into GCONF2 register */
        // APDS9960_GCONF2
        wireWriteDataByte(0xA3, val)

    }

    //%blockId=SL06_getGestureIntEnable
    //%block="SL06 get gesture int enable"
    //%advanced=true
    //%group=Gesture
    function getGestureIntEnable() {
        let val = 0;

        /* Read value from GCONF4 register */
        // APDS9960_GCONF4
        val = wireReadDataByte(0xAB)

        /* Shift and mask out GIEN bit */
        val = (val >> 1) & 0b00000001;

        return val;
    }

    //%blockId=SL06_setGestureIntEnable
    //%block="SL06 set gesture int enable %enable"
    //%group=Gesture
    //%advanced=true
    function setGestureIntEnable(enable: number): void {
        let val = 0;

        /* Read value from GCONF4 register */
        // APDS9960_GCONF4
        val = wireReadDataByte(0xAB)
        /* Set bits in register to given value */
        enable &= 0b00000001;
        enable = enable << 1;
        val &= 0b11111101;
        val |= enable;

        /* Write register value back into GCONF4 register */
        // APDS9960_GCONF4
        wireWriteDataByte(0xAB, val)

    }

    //%blockId=SL06_isGestureAvailable
    //%block="SL06 is gesture available"
    //%group=Gesture
    function isGestureAvailable() {
        let val = 0;

        /* Read value from GSTATUS register */
        // APDS9960_GSTATUS
        val = wireReadDataByte(0xAF)

        /* Shift and mask out GVALID bit */
        // APDS9960_GVALID
        val &= 0b00000001;

        /* Return true/false based on GVALID bit */
        if (val == 1) {
            return true;
        } else {
            return false;
        }
    }

    //%blockId=SL06_getGesture
    //%block="SL06 gesture"
    //%group=Gesture
    export function gesture(): string {
        let fifo_level = 0;
        let bytes_read = 0;
        let gstatus: number;
        let fifo_data: number[] = []
        let motion: string;
        let i: number;
        let mode: number = getMode() & 0b01000001


        /* Make sure that power and gesture is on and data is valid */
        if (!isGestureAvailable() || !(mode)) {
            return DIR_NONE;
        }

        /* Keep looping as long as gesture data is valid */
        while (1) {

            /* Wait some time to collect next batch of FIFO data */
            // FIFO_PAUSE_TIME
            basic.pause(30);

            /* Get the contents of the STATUS register. Is data still valid? */
            // APDS9960_GSTATUS
            gstatus = wireReadDataByte(0xAF)

            console.logValue("gstatus", gstatus)

            /* If we have valid data, read in FIFO */
            if ((gstatus & 0b00000001) == 0b00000001) {

                /* Read the current FIFO level */
                // APDS9960_GFLVL
                fifo_level = wireReadDataByte(0xAE)

                /* If there's stuff in the FIFO, read it into our data block */
                if (fifo_level > 0) {
                    //APDS9960_GFIFO_U
                    fifo_data = wireReadDataBlock(0xFC, (fifo_level * 4));

                    bytes_read = fifo_data.length

                    /* If at least 1 set of data, sort the data into U/D/L/R */
                    if (fifo_data.length >= 4) {
                        for (i = 0; i < bytes_read; i += 4) {
                            gesture_data_u_data[gesture_data_index] = fifo_data[i + 0];
                            gesture_data_d_data[gesture_data_index] = fifo_data[i + 1];
                            gesture_data_l_data[gesture_data_index] = fifo_data[i + 2];
                            gesture_data_r_data[gesture_data_index] = fifo_data[i + 3];
                            gesture_data_index++;
                            gesture_data_total_gestures++;
                        }

                        /* Filter and process gesture data. Decode near/far state */
                        if (processGestureData()) {
                            if (decodeGesture()) {
                            }
                        }

                        /* Reset data */
                        gesture_data_index = 0;
                        gesture_data_total_gestures = 0;
                    }
                }
            } else {

                /* Determine best guessed gesture and clean up */
                basic.pause(30);
                decodeGesture();
                motion = gesture_motion_;
                resetGestureParameters();
                return motion;
                console.log("Else")
            }
        }

        return DIR_ALL
    }

    function decodeGesture(): boolean {
        /* Return if near or far event is detected */
        if (gesture_state_ == states.NEAR_STATE1) {
            gesture_motion_ = DIR_NEAR;
            return true;
        }
        else if (gesture_state_ == states.FAR_STATE1) {
            gesture_motion_ = DIR_FAR;
            return true;
        }

        /* Determine swipe direction */
        if ((gesture_ud_count_ == -1) && (gesture_lr_count_ == 0)) {
            gesture_motion_ = DIR_UP;
        }
        else if ((gesture_ud_count_ == 1) && (gesture_lr_count_ == 0)) {
            gesture_motion_ = DIR_DOWN;
        }
        else if ((gesture_ud_count_ == 0) && (gesture_lr_count_ == 1)) {
            gesture_motion_ = DIR_RIGHT;
        }
        else if ((gesture_ud_count_ == 0) && (gesture_lr_count_ == -1)) {
            gesture_motion_ = DIR_LEFT;
        }
        else if ((gesture_ud_count_ == -1) && (gesture_lr_count_ == 1)) {
            if (Math.abs(gesture_ud_delta_) > Math.abs(gesture_lr_delta_)) {
                gesture_motion_ = DIR_UP;
            }
            else {
                gesture_motion_ = DIR_RIGHT;
            }
        }
        else if ((gesture_ud_count_ == 1) && (gesture_lr_count_ == -1)) {
            if (Math.abs(gesture_ud_delta_) > Math.abs(gesture_lr_delta_)) {
                gesture_motion_ = DIR_DOWN;
            }
            else {
                gesture_motion_ = DIR_LEFT;
            }
        }
        else if ((gesture_ud_count_ == -1) && (gesture_lr_count_ == -1)) {
            if (Math.abs(gesture_ud_delta_) > Math.abs(gesture_lr_delta_)) {
                gesture_motion_ = DIR_UP;
            }
            else {
                gesture_motion_ = DIR_LEFT;
            }
        }
        else if ((gesture_ud_count_ == 1) && (gesture_lr_count_ == 1)) {
            if (Math.abs(gesture_ud_delta_) > Math.abs(gesture_lr_delta_)) {
                gesture_motion_ = DIR_DOWN;
            }
            else {
                gesture_motion_ = DIR_RIGHT;
            }
        }
        else {
            return false;
        }

        return true;
    }


    function processGestureData(): boolean {
        let u_first = 0;
        let d_first = 0;
        let l_first = 0;
        let r_first = 0;
        let u_last = 0;
        let d_last = 0;
        let l_last = 0;
        let r_last = 0;
        let ud_ratio_first = 0;
        let lr_ratio_first = 0;
        let ud_ratio_last = 0;
        let lr_ratio_last = 0;
        let ud_delta = 0;
        let lr_delta = 0;
        let i = 0;

        /* If we have less than 4 total gestures, that's not enough */
        if (gesture_data_total_gestures <= 4) {
            return false;
        }

        /* Check to make sure our data isn't out of bounds */
        if ((gesture_data_total_gestures <= 32) &&
            (gesture_data_total_gestures > 0)) {

            /* Find the first value in U/D/L/R above the threshold */
            for (i = 0; i < gesture_data_total_gestures; i++) {
                // GESTURE_THRESHOLD_OUT
                if ((gesture_data_u_data[i] > 10) &&
                    (gesture_data_d_data[i] > 10) &&
                    (gesture_data_l_data[i] > 10) &&
                    (gesture_data_r_data[i] > 10)) {

                    u_first = gesture_data_u_data[i];
                    d_first = gesture_data_d_data[i];
                    l_first = gesture_data_l_data[i];
                    r_first = gesture_data_r_data[i];
                    break;
                }
            }

            /* If one of the _first values is 0, then there is no good data */
            if ((u_first == 0) || (d_first == 0) ||
                (l_first == 0) || (r_first == 0)) {

                return false;
            }
            /* Find the last value in U/D/L/R above the threshold */
            for (i = gesture_data_total_gestures - 1; i >= 0; i--) {

                if ((gesture_data_u_data[i] > 10) &&
                    (gesture_data_d_data[i] > 10) &&
                    (gesture_data_l_data[i] > 10) &&
                    (gesture_data_r_data[i] > 10)) {

                    u_last = gesture_data_u_data[i];
                    d_last = gesture_data_d_data[i];
                    l_last = gesture_data_l_data[i];
                    r_last = gesture_data_r_data[i];
                    break;
                }
            }
        }

        /* Calculate the first vs. last ratio of up/down and left/right */
        ud_ratio_first = ((u_first - d_first) * 100) / (u_first + d_first);
        lr_ratio_first = ((l_first - r_first) * 100) / (l_first + r_first);
        ud_ratio_last = ((u_last - d_last) * 100) / (u_last + d_last);
        lr_ratio_last = ((l_last - r_last) * 100) / (l_last + r_last);

        /* Determine the difference between the first and last ratios */
        ud_delta = ud_ratio_last - ud_ratio_first;
        lr_delta = lr_ratio_last - lr_ratio_first;

        /* Accumulate the UD and LR delta values */
        gesture_ud_delta_ += ud_delta;
        gesture_lr_delta_ += lr_delta;

        /* Determine U/D gesture */
        // GESTURE_SENSITIVITY_1
        if (gesture_ud_delta_ >= 50) {
            gesture_ud_count_ = 1;
        }
        else if (gesture_ud_delta_ <= -50) {
            gesture_ud_count_ = -1;
        }
        else {
            gesture_ud_count_ = 0;
        }

        /* Determine L/R gesture */
        if (gesture_lr_delta_ >= 50) {
            gesture_lr_count_ = 1;
        }
        else if (gesture_lr_delta_ <= -50) {
            gesture_lr_count_ = -1;
        }
        else {
            gesture_lr_count_ = 0;
        }

        /* Determine Near/Far gesture */
        if ((gesture_ud_count_ == 0) && (gesture_lr_count_ == 0)) {
            // GESTURE_SENSITIVITY_2
            if ((Math.abs(ud_delta) < 20) &&
                (Math.abs(lr_delta) < 20)) {

                if ((ud_delta == 0) && (lr_delta == 0)) {
                    gesture_near_count_++;
                }
                else if ((ud_delta != 0) || (lr_delta != 0)) {
                    gesture_far_count_++;
                }

                if ((gesture_near_count_ >= 10) && (gesture_far_count_ >= 2)) {
                    if ((ud_delta == 0) && (lr_delta == 0)) {
                        gesture_state_ = states.NEAR_STATE1;
                    }
                    else if ((ud_delta != 0) && (lr_delta != 0)) {
                        gesture_state_ = states.FAR_STATE1;
                    }
                    return true;
                }
            }
        }
        else {
            // GESTURE_SENSITIVITY_2
            if ((Math.abs(ud_delta) < 20) &&
                (Math.abs(lr_delta) < 20)) {

                if ((ud_delta == 0) && (lr_delta == 0)) {
                    gesture_near_count_++;
                }

                if (gesture_near_count_ >= 10) {
                    gesture_ud_count_ = 0;
                    gesture_lr_count_ = 0;
                    gesture_ud_delta_ = 0;
                    gesture_lr_delta_ = 0;
                }
            }
        }
        return false;
    }

    //%blockId=SL06_enableProximitySensor
    //%block="SL06 enable proximity sensor"
    //%interrupts.defl=false
    //%group=Proximity
    export function enableProximitySensor(): void {
        /* Set default gain, LED, interrupts, enable power, and enable sensor */
        // DEFAULT_PGAIN
        setProximityGain(2)

        // DEFAULT_LDRIVE
        setLEDDrive(0)

        setProximityIntEnable(0)

        enablePower()

        setMode(2, 1)

    }

    //%blockId=SL06_disableProximitySensor
    //%block="SL06 disble proximity sensor"
    //%group=Proximity
    export function disableProximitySensor(): void {
        setProximityIntEnable(0)

        setMode(2, 0)
    }

    function setProximityIntEnable(enable: number): void {
        let val: number;

        /* Read value from ENABLE register */
        // APDS9960_ENABLE
        val = wireReadDataByte(0x80)

        /* Set bits in register to given value */
        enable &= 0b00000001;
        enable = enable << 5;
        val &= 0b11011111;
        val |= enable;

        /* Write register value back into ENABLE register */
        // APDS9960_ENABLE
        wireWriteDataByte(0x80, val)

    }

    //%blockId=SL06_getProximityGain
    //%block="SL06 get proximity gain"
    //%advanced=true
    //%group=Proximity
    function getProximityGain(): number {
        let val = 0;

        /* Read value from CONTROL register */
        // APDS9960_CONTROL
        val = wireReadDataByte(0x8F)

        /* Shift and mask out PDRIVE bits */
        val = (val >> 2) & 0b00000011;

        return val;
    }

    //%blockId=SL06_setProximityGain
    //%block="SL06 set proximity gain %drive"
    //%advanced=true
    //%group=Proximity
    function setProximityGain(drive: NumberFormat.UInt8BE): void {
        let val: number;

        /* Read value from CONTROL register */
        // APDS9960_CONTROL
        val = wireReadDataByte(0x8F)

        /* Set bits in register to given value */
        drive &= 0b00000011;
        drive = drive << 2;
        val &= 0b11110011;
        val |= drive;

        /* Write register value back into CONTROL register */
        // APDS9960_CONTROL
        wireWriteDataByte(0x8F, val)
    }

    //%blockId=SL06_getProximity
    //%block="SL06 proximity"
    //%group=Proximity
    export function proximity() {
        let val: number = 0;

        /* Read value from proximity data register */
        // APDS9960_PDATA
        val = wireReadDataByte(0x9C)

        return val
    }

    //%blockId=SL06_enableLightSensor
    //%block="SL06 enable light sensor"
    //%interrupts.defl=false
    //%group=Light
    export function enableLightSensor(): void {

        /* Set default gain, interrupts, enable power, and enable sensor */
        setAmbientLightGain(0)

        setAmbientLightIntEnable(0)

        enablePower()

        // AMBIENT_LIGHT
        setMode(1, 1)

    }

    //%blockId=SL06_disableLightSensor
    //%block="SL06 disable light sensor"
    //%group=Light
    export function disableLightSensor(): void {
        setAmbientLightIntEnable(0)

        // AMBIENT_LIGHT
        setMode(1, 0)

    }

    //%blockId=SL06_getAmbientLightGain
    //%block="SL06 get ambient light gain"
    //%group=Light
    //%advanced=true
    function getAmbientLightGain(): number {
        let val: number;

        /* Read value from CONTROL register */
        // APDS9960_CONTROL
        val = wireReadDataByte(0x8F)

        /* Shift and mask out ADRIVE bits */
        val &= 0b00000011;

        return val;
    }

    //%blockId=SL06_setAmbientLightGain
    //%block="SL06 set ambient light gain %drive"
    //%group=Light
    //%advanced=true
    function setAmbientLightGain(drive: number): void {
        let val: number;

        /* Read value from CONTROL register */
        // APDS9960_CONTROL
        val = wireReadDataByte(0x8F)

        /* Set bits in register to given value */
        drive &= 0b00000011;
        val &= 0b11111100;
        val |= drive;

        /* Write register value back into CONTROL register */
        // APDS9960_CONTROL
        wireWriteDataByte(0x8F, val)
    }

    //%blockId=SL06_clearAmbientLightInt
    //%block="SL06 clear ambient light int"
    //%group=Light
    //%advanced=true
    function clearAmbientLightInt(): void {
        let throwaway: number;
        // APDS9960_AICLEAR
        throwaway = wireReadDataByte(0xE7)
    }

    //%blockId=SL06_getAmbientLight
    //%block="SL06 illuminance %u"
    //%group=Light
    export function ambientLight(u: light_unit): number {
        let val_byte: number;
        let val: number = 0;

        /* Read value from clear channel, low byte register */
        // APDS9960_CDATAL
        val_byte = wireReadDataByte(0x94)
        val = val_byte;

        /* Read value from clear channel, high byte register */
        // APDS9960_CDATAH
        val_byte = wireReadDataByte(0x95)
        val = val + (val_byte << 8);

        if (u == light_unit.FC)
            val = val / 10.764

        return val
    }

    //%blockId=SL06_getRedLight
    //%block="SL06 red light"
    //%group=Light
    export function redLight(): number {
        let val_byte: number;
        let val: number = 0;

        /* Read value from clear channel, low byte register */
        // APDS9960_RDATAL
        val_byte = wireReadDataByte(0x96)
        val = val_byte;

        /* Read value from clear channel, high byte register */
        val_byte = wireReadDataByte(0x97)
        val = val + (val_byte << 8);

        return val;
    }

    //%blockId=SL06_getGreenLight
    //%block="SL06 green light"
    //%group=Light
    export function greenLight(): number {
        let val_byte: number;
        let val: number = 0;

        /* Read value from clear channel, low byte register */
        // APDS9960_GDATAL
        val_byte = wireReadDataByte(0x98)

        val = val_byte;

        /* Read value from clear channel, high byte register */
        // APDS9960_GDATAH
        val_byte = wireReadDataByte(0x99)

        val = val + (val_byte << 8);

        return val;
    }

    //%blockId=SL06_getBlueLight
    //%block="SL06 blue light"
    //%group=Light
    export function blueLight(): number {
        let val_byte: number;
        let val: number = 0;

        /* Read value from clear channel, low byte register */
        // APDS9960_BDATAL
        val_byte = wireReadDataByte(0x9A)

        val = val_byte;

        /* Read value from clear channel, high byte register */
        // APDS9960_BDATAH
        val_byte = wireReadDataByte(0x9B)

        val = val + (val_byte << 8);

        return val;
    }

    function setProxIntLowThresh(threshold: number) {
        // APDS9960_PILT
        wireWriteDataByte(0x89, threshold)
    }

    function setProxIntHighThresh(threshold: number) {
        // APDS9960_PIHT
        wireWriteDataByte(0x8B, threshold)
    }

    function setLightIntLowThreshold(threshold: number) {
        let val_low: number;
        let val_high: number;

        /* Break 16-bit threshold into 2 8-bit values */
        val_low = threshold & 0x00FF;
        val_high = (threshold & 0xFF00) >> 8;

        /* Write low byte */
        // APDS9960_AILTL
        if (!wireWriteDataByte(0x84, val_low)) {
            return false;
        }

        /* Write high byte */
        // APDS9960_AILTH
        if (!wireWriteDataByte(0x85, val_high)) {
            return false;
        }

        return true;
    }

    function setLightIntHighThreshold(threshold: number) {
        let val_low: number;
        let val_high: number;

        /* Break 16-bit threshold into 2 8-bit values */
        val_low = threshold & 0x00FF;
        val_high = (threshold & 0xFF00) >> 8;

        /* Write low byte */
        // APDS9960_AIHTL
        if (!wireWriteDataByte(0x86, val_low)) {
            return false;
        }

        /* Write high byte */
        // APDS9960_AIHTH
        if (!wireWriteDataByte(0x87, val_high)) {
            return false;
        }

        return true;
    }

    function setGestureEnterThresh(threshold: number): void {
        // APDS9960_GPENTH
        wireWriteDataByte(0xA0, threshold)

    }

    function setGestureExitThresh(threshold: number): void {
        // APDS9960_GEXTH
        wireWriteDataByte(0xA1, threshold)

    }

    function setGestureWaitTime(time: number) {
        let val: number;

        /* Read value from GCONF2 register */
        // APDS9960_GCONF2
        val = wireReadDataByte(0xA3)

        /* Set bits in register to given value */
        time &= 0b00000111;
        val &= 0b11111000;
        val |= time;

        /* Write register value back into GCONF2 register */
        // APDS9960_GCONF2
        wireWriteDataByte(0xA3, val)
    }

    function setLEDBoost(boost: number) {
        let val: number;

        /* Read value from CONFIG2 register */
        // APDS9960_CONFIG2
        val = wireReadDataByte(0x90)

        /* Set bits in register to given value */
        boost &= 0b00000011;
        boost = boost << 4;
        val &= 0b11001111;
        val |= boost;

        /* Write register value back into CONFIG2 register */
        // APDS9960_CONFIG2
        wireWriteDataByte(0x90, val)
    }

    function setGestureMode(mode: number) {
        let val: number;

        /* Read value from GCONF4 register */
        // APDS9960_GCONF4
        val = wireReadDataByte(0xAB)

        /* Set bits in register to given value */
        mode &= 0b00000001;
        val &= 0b11111110;
        val |= mode;

        /* Write register value back into GCONF4 register */
        // APDS9960_GCONF4
        wireWriteDataByte(0xAB, val);
    }

    function resetGestureParameters() {
        gesture_data_index = 0;
        gesture_data_total_gestures = 0;

        gesture_ud_delta_ = 0;
        gesture_lr_delta_ = 0;

        gesture_ud_count_ = 0;
        gesture_lr_count_ = 0;

        gesture_near_count_ = 0;
        gesture_far_count_ = 0;

        gesture_state_ = 0;
        gesture_motion_ = DIR_NONE;
    }

    function setAmbientLightIntEnable(enable: number): void {
        let val: number;

        /* Read value from ENABLE register */
        // APDS9960_ENABLE
        val = wireReadDataByte(0x80)

        /* Set bits in register to given value */
        enable &= 0b00000001;
        enable = enable << 4;
        val &= 0b11101111;
        val |= enable;

        /* Write register value back into ENABLE register */
        // APDS9960_ENABLE
        wireWriteDataByte(0x80, val)
    }


    function wireWriteByte(val: NumberFormat.UInt8BE): boolean {
        pins.i2cWriteNumber(APDS9960_I2C_ADDR, val, NumberFormat.UInt8BE)
        return true;
    }

    function wireWriteDataByte(reg: number, val: number): boolean {
        let buf = pins.createBuffer(2)
        buf[0] = reg;
        buf[1] = val;
        pins.i2cWriteBuffer(APDS9960_I2C_ADDR, buf)
        return true;
    }


    function wireReadDataByte(reg: number): number {
        pins.i2cWriteNumber(APDS9960_I2C_ADDR, reg, NumberFormat.UInt8BE);
        let val: number = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8BE)
        return val
    }

    function wireReadDataBlock(reg: NumberFormat.UInt8LE, len: number): number[] {
        let buff: number[] = []

        pins.i2cWriteNumber(APDS9960_I2C_ADDR, 0xFC, NumberFormat.UInt8LE, true);
        buff[0] = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8LE);

        pins.i2cWriteNumber(APDS9960_I2C_ADDR, 0xFD, NumberFormat.UInt8LE, true);
        buff[1] = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8LE);

        pins.i2cWriteNumber(APDS9960_I2C_ADDR, 0xFE, NumberFormat.UInt8LE, true);
        buff[2] = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8LE);

        pins.i2cWriteNumber(APDS9960_I2C_ADDR, 0xFF, NumberFormat.UInt8LE, true);
        buff[3] = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8LE);


        return buff
    }

    begin();
}

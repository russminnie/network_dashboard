#!/usr/bin/python
import json
## global variable

class Decoder():
    RESET_EVENT = "00"
    SUPERVISORY_EVENT = "01"
    TAMPER_EVENT = "02"
    LINK_QUALITY_EVENT = "FB"
    RATE_LIMIT_EXCEEDED_EVENT = "FC"
    TEST_MESSAGE_EVENT = "FD"
    DOWNLINK_ACK_EVENT = "FF"
    DOOR_WINDOW_EVENT = "03"
    PUSH_BUTTON_EVENT = "06"
    CONTACT_EVENT = "07"
    WATER_EVENT = "08"
    TEMPERATURE_EVENT = "09"
    TILT_EVENT = "0A"
    ATH_EVENT = "0D"
    ABM_EVENT = "0E"
    TILT_HP_EVENT = "0F"
    ULTRASONIC_EVENT = "10"
    SENSOR420MA_EVENT = "11"
    THERMOCOUPLE_EVENT = "13"
    VOLTMETER_EVENT = "14"
    CUSTOM_SENSOR_EVENT = "15"
    GPS_EVENT = "16"
    HONEYWELL5800_EVENT = "17"
    MAGNETOMETER_EVENT = "18"
    VIBRATION_LB_EVENT = "19"
    VIBRATION_HB_EVENT = "1A"
    
    def get_device_type(self, device_type_byte):
        device_types = {
            '01': "Door/Window Sensor",
            '02': "Door/Window High Security",
            '03': "Contact Sensor",
            '04': "No-Probe Temperature Sensor",
            '05': "External-Probe Temperature Sensor",
            '06': "Single Push Button",
            '07': "Dual Push Button",
            '08': "Acceleration-Based Movement Sensor",
            '09': "Tilt Sensor",
            '0A': "Water Sensor",
            '0B': "Tank Level Float Sensor",
            '0C': "Glass Break Sensor",
            '0D': "Ambient Light Sensor",
            '0E': "Air Temperature and Humidity Sensor",
            '0F': "High-Precision Tilt Sensor",
            '10': "Ultrasonic Level Sensor",
            '11': "4-20mA Current Loop Sensor",
            '12': "Ext-Probe Air Temp and Humidity Sensor",
            '13': "Thermocouple Temperature Sensor",
            '14': "Voltage Sensor",
            '15': "Custom Sensor",
            '16': "GPS",
            '17': "Honeywell 5800 Bridge",
            '18': "Magnetometer",
            '19': "Vibration Sensor - Low Frequency",
            '1A': "Vibration Sensor - High Frequency"
        }
        return device_types.get(device_type_byte, "Device Undefined")

    def Generic_Decoder(self, bytes):
        #ProtocolVersion = (bytes[0] >> 4) & 0x0f
        #PacketCounter = bytes[0] & 0x0f

        Eventtype = self.Hex(bytes[1])
        if(Eventtype == self.PUSH_BUTTON_EVENT):
            return self.PUSH_BUTTON(bytes)
        elif(Eventtype == self.RESET_EVENT):
            return self.RESET(bytes)
        elif(Eventtype == self.SUPERVISORY_EVENT):
            return self.SUPERVISORY(bytes)
        elif(Eventtype == self.TAMPER_EVENT):
            return self.TAMPER(bytes)
        elif(Eventtype == self.LINK_QUALITY_EVENT):
            return self.LINK_QUALITY(bytes)
        elif(Eventtype == self.DOOR_WINDOW_EVENT):
            return self.DOOR_WINDOW(bytes)
        elif(Eventtype == self.CONTACT_EVENT):
            return self.CONTACT(bytes)
        elif(Eventtype == self.WATER_EVENT):
            return self.WATER(bytes)
        elif(Eventtype == self.TEMPERATURE_EVENT):
            return self.TEMPERATURE(bytes)
        elif(Eventtype == self.TILT_EVENT):
            return self.TILT(bytes)
        elif(Eventtype == self.ULTRASONIC_EVENT):
            return self.ULTRASONIC(bytes)
        elif(Eventtype == self.SENSOR420MA_EVENT):
            return self.SENSOR420MA(bytes)
        elif(Eventtype == self.THERMOCOUPLE_EVENT):
            return self.THERMOCOUPLE(bytes)
        elif(Eventtype == self.ATH_EVENT):
            return self.ATH(bytes)
        elif(Eventtype == self.ABM_EVENT):
            return self.ABM(bytes)
        elif(Eventtype == self.DOWNLINK_ACK_EVENT):
            return self.DOWNLINK_ACK(bytes)
        else:
            return "undefined"

    def RESET(self, bytes):
        decoded = {
            "Event": "Reset",
            "Device Type": self.get_device_type(self.Hex(bytes[2]))
        }

        # Hardware version
        hardware_version = f"{(bytes[3] >> 4) & 0x0f}.{bytes[3] & 0x0f}"
        decoded["Hardware Version"] = f"v{hardware_version}"

        # Firmware version
        firmware_format = (bytes[4] >> 7) & 0x01
        if firmware_format == 0:
            firmware_version = f"{bytes[4]}.{bytes[5]}"
        else:
            firmware_version = f"{(bytes[4] >> 2) & 0x1F}.{((bytes[4] & 0x03) + ((bytes[5] >> 5) & 0x07))}.{bytes[5] & 0x1F}"
        
        decoded["Firmware Version"] = f"v{firmware_version}"
        return json.dumps(decoded)

    def SUPERVISORY(self, bytes):
        decoded = {}
        decoded["Event"] = "Supervisory"
        ## note that the sensor state in the supervisory message is being depreciated, so those are not decoded here
        ## battery voltage is in the format x.y volts where x is upper nibble and y is lower nibble4

        BatteryLevel = str(((bytes[4] >> 4) & 0x0f)) + "." + str((bytes[4] & 0x0f))
        Text = ["no", "yes"]
        decoded["Battery Voltage"] = str(BatteryLevel) + "V"
        # the accumulation count is a 16-bit value
        AccumulationCount = (bytes[9] * 256) + bytes[10]
        decoded["Acucumulation Count"] = AccumulationCount

        # decode bits for error code byte
        TamperSinceLastReset = int((bytes[2] >> 4) & 0x01)
        if(Text[TamperSinceLastReset] != "no"):
            decoded["Tamper Since Last Reset"] = TamperSinceLastReset

        CurrentTamperState = int((bytes[2] >> 3) & 0x01)
        if(Text[CurrentTamperState] != "no"):
            decoded["Current Tamper State"] = CurrentTamperState

        ErrorWithLastDownlink = int((bytes[2] >> 2) & 0x01)
        if(Text[ErrorWithLastDownlink] != "no"):
            decoded["Error With Last Downlink"] = ErrorWithLastDownlink

        BatteryLow = int((bytes[2] >> 1) & 0x01)
        if(Text[BatteryLow] != "no"):
            decoded["Battery Low"] = BatteryLow

        RadioCommError =int(bytes[2] & 0x01)
        if(Text[RadioCommError] != "no"):
            decoded["Radio Comm Error"] = RadioCommError

        return json.dumps(decoded)

    def TAMPER(self, bytes):
        decoded = {}
        decoded["Event"] = "Tamper"

        TamperState = bytes[2]

        if (TamperState == 0):
            decoded["State"] = "Open"
        else:
            decoded["State"] = "Closed"
        return json.dumps(decoded)

    def LINK_QUALITY(self, bytes):
        decoded = {}
        decoded["Event"] = "Link Quality"

        CurrentSubBand = bytes[2]
        decoded["Current Sub-Band"] = CurrentSubBand

        RSSILastDownlink = bytes[3]
        decoded["RSSI of Last Downlink"] = RSSILastDownlink

        SNRLastDownlink = bytes[4]
        decoded["SNR of Last Downlink"] = SNRLastDownlink
        return json.dumps(decoded)
        
    def DOOR_WINDOW(self, bytes):
        decoded = {}
        decoded["Event"] = "Door/Window"

        SensorState = bytes[2]

        if(SensorState == 0):
            decoded["State"] = "Closed"
        else:
            decoded["State"] = "Open"
        return json.dumps(decoded)

    def PUSH_BUTTON(self, bytes):
        decoded = {}
        decoded["Event"] = "Push Event"
        ButtonID = int(self.Hex(bytes[2]))
        BI = [0, "Button 1 (Right)", "Button 2 (Left)", "Single Button",0, 0, 0, 0, 0, 0, 0, 0, "Both Buttons" ]
        if ButtonID <len(BI):
            decoded["Button ID"] = BI[ButtonID]
            ButtonState = bytes[3]
            BS = ["Pressed", "Released", "Held"]
            decoded["Button State"] = BS[ButtonState]
        else:
            decoded["Button ID"] = "Undefined"
        return json.dumps(decoded)

    def CONTACT(self, bytes):
        decoded = {}
        decoded["Event"] = "Dry Contact"

        ContactState = bytes[2]

        if (ContactState == 0):
            SensorState = "Contacts  Shorted"
        else:
            SensorState = "Contacts Opened"
        decoded["State"] = SensorState
        return json.dumps(decoded)

    def WATER(self, bytes):
        decoded = {}
        decoded["Event"] = "Water"

        SensorState = bytes[2]

        if(SensorState == 0):
            decoded["State"] = "Water Present"
        else:
            decoded["State"] = "Water Not Present"
        
        WaterRelativeResistance = bytes[3]

        decoded["Relative Resistance"] = WaterRelativeResistance

        return json.dumps(decoded)

    def TEMPERATURE(self, bytes):
        decoded = {}
        decoded["Event"] = "Temperature"

        TemperatureEvent = int(bytes[2])
        Text =["Periodic Report", "Above Upper Threshold", "Below Lower Threshold", "Change Increase", "Change Decrease", "Fault"]
        
        decoded["Temperature Event"] =  Text[TemperatureEvent]
        ## current temperature reading
        CurrentTemperature = self.Convert(bytes[3], 0)
        decoded["Current Temperature"] = CurrentTemperature

        ## relative temp measurement for use with an alternative calibration table
        RelativeMeasurement = self.Convert(bytes[4], 0)
        decoded["Relative Measurement"] = RelativeMeasurement
        return json.dumps(decoded)

    def TILT(self, bytes):
        decoded = {}
        decoded["Event"] = "Tilt"

        TiltEvent = bytes[2]

        if (TiltEvent == 0):
            TiltEventDescription = "Transitioned to Vertical"
        elif(TiltEvent == 1):
            TiltEventDescription = "Transitioned to Horizontal"
        elif(TiltEvent == 2):
            TiltEventDescription = "Report-on-Change Toward Vertical"
        elif(TiltEvent == 3):
            TiltEventDescription = "Report-on-Change Toward Horizontal"
        else: 
            TiltEventDescription = "Undefined"
        decoded["Tilt Event"] = TiltEventDescription

        TiltAngle = bytes[3]

        decoded["Tilt Angle"] = TiltAngle

        return decoded

    def ATH(self, bytes):
        decoded = {}
        decoded["Event"] = "Air Temperature/Humidity"

        ATHEvent = int(bytes[2])
        Text = ["Periodic Report", "Temperature Above Upper Threshold", "Temperature Below Lower Threshold", "Temperature Change Increase", "Temperature Change Decrease","Humidity Above Upper Threhsold", "Humidity Below Lower Threshold", "Humidity Change Increase", "Humidity Change Decrease"]

        decoded["ATH Event"] = Text[ATHEvent]

        ## integer and fractional values between two bytes
        Temperature = self.Convert((bytes[3]) + ((bytes[4] >> 4) / 10), 1);
        decoded["Temperature"] = Temperature

        Humidity = +(bytes[5] + ((bytes[6]>>4) / 10)).toFixed(1);
        decoded["Humidity"] = Humidity

        return json.dumps(decoded)

    def ABM(self, bytes):
        decoded = {}
        decoded["Event"] = "Acceleration-Based movement"

        ABMEvent = bytes[2]

        if(ABMEvent == 0):
            ABMEventDescription = "Movement Started"
        else:
            ABMEventDescription = "Movement Stopped"
        
        decoded["ABM Event"] =  ABMEventDescription
        return json.dumps(decoded)

    def TILT_HP(self, bytes):
        decoded = {}
        decoded["events"] = "High-Precision Tilt"

        TiltEvent = int(bytes[2])
        Text = ["Periodic Report", "Vertical Tansition", "Horizontal Transition",
            "Change Towoard Vertical", "Change Toward Horizontal"]

        decoded["Tilt HP Event"] =  Text[TiltEvent]
        ## integer and fractional values between two bytes
        Angle = +round((bytes[3] + bytes[4] / 10), 1)
        decoded["Angle"] = Angle

        Temperature = self.Convert(bytes[5], 0)
        decoded["Temperature"] = Temperature

        return json.dumps(decoded)

    def ULTRASONIC(self, bytes):
        decoded = {}
        decoded["Event"] = "Ultrasonic Level"

        UltrasonicEvent = bytes[2]
        if(UltrasonicEvent == 0):
            UltrasonicEventDescription = "Periodic Report"
        elif(UltrasonicEvent == 1):
            UltrasonicEventDescription = "Distance has Risen Above Upper Threshold"
        elif(UltrasonicEvent == 2):
            UltrasonicEventDescription = "Distance has Fallen Below Lower Threshold"
        elif(UltrasonicEvent == 3):
            UltrasonicEventDescription = "Report-on-Change Increase"
        elif(UltrasonicEvent == 4):
            UltrasonicEventDescription = "Report-on-Change Decrease"
        else:
            UltrasonicEventDescription = "Undefined"

        decoded["Ultrasonic Event"] = UltrasonicEventDescription

        #  distance is calculated across 16-bits
        Distance = ((bytes[3] * 256) + bytes[4])

        decoded["Distance"] = Distance

        return json.dumps(decoded)

    def SENSOR420MA(self, bytes):
        decoded = {}
        decoded["Event"] = "4-20mA"

        Sensor420mAEvent = bytes[2]

        if(Sensor420mAEvent == 0):
            Sensor420mAEventDescription = "Periodic Report"
        elif(Sensor420mAEvent == 1):
            Sensor420mAEventDescription = "Analog Value has Risen Above Upper Threshold"
        elif(Sensor420mAEvent == 2):
            Sensor420mAEventDescription = "Analog Value has Fallen Below Lower Threshold"
        elif(Sensor420mAEvent == 3):
            Sensor420mAEventDescription = "Report on Change Increase"
        elif(Sensor420mAEvent == 4):
            Sensor420mAEventDescription = "Report on Change Decrease"
        else:
            Sensor420mAEventDescription = "Undefined"

        decoded["4-20mA Event"] = Sensor420mAEventDescription

        Analog420Measurement = ((bytes[3] * 256) + bytes[4]) / 100

        decoded["Current Measurement in mA"] = Analog420Measurement

        return json.dumps(decoded)

    def THERMOCOUPLE(self, bytes):
        decoded = {}
        decoded["Event"] = "Thermocouple"

        ThermocoupleEvent = bytes[2]

        if(ThermocoupleEvent == 0):
            ThermocoupleEventDescription = "Periodic Report"
        elif(ThermocoupleEvent == 1):
            ThermocoupleEventDescription = "Analog Value has Risen Above Upper Threshold"
        elif(ThermocoupleEvent == 2):
            ThermocoupleEventDescription = "Analog Value has Fallen Below Lower Threshold"
        elif(ThermocoupleEvent == 3):
            ThermocoupleEventDescription = "Report on Change Increase"
        elif(ThermocoupleEvent == 4):
            ThermocoupleEventDescription = "Report on Change Decrease"
        else:
            ThermocoupleEventDescription = "Undefined"

        decoded["Thermacouple Event"] = ThermocoupleEventDescription

        Tempertature = int(((bytes[3] *256) + bytes[4]) / 16)

        decoded["Temperature"] =  str(Tempertature) + "C"

        Faults = bytes[5]

        FaultColdOutsideRange = (Faults >> 7) & 0x01
        FaultHotOutsideRange = (Faults >> 6) & 0x01
        FaultColdAboveThresh = (Faults >> 5) & 0x01
        FaultColdBelowThresh = (Faults >> 4) & 0x01
        FaultTCTooHigh = (Faults >> 3) & 0x01
        FaultTCTooLow = (Faults >> 2) & 0x01
        FaultVoltageOutsideRange = (Faults >> 1) & 0x01
        FaultOpenCircuit = Faults & 0x01

        if (Faults == 0):
            decoded["Fault"] = ""
        else:
            if (FaultColdOutsideRange):
                decoded["Fault"] = "The cold-Junction temperature is outside of the normal operating range"

            elif (FaultHotOutsideRange):
                decoded["Fault"] = "The hot junction temperature is outside of the normal operating range"

            elif (FaultColdAboveThresh):
                decoded["Fault"] = "The cold-Junction temperature is at or above than the cold-junction temperature high threshold"

            elif (FaultColdBelowThresh):
                decoded["Fault"] = "The Cold-Junction temperature is lower than the cold-junction temperature low threshold"

            elif (FaultTCTooHigh):
                decoded["Fault"] = "The thermocouple temperature is too high"

            elif (FaultTCTooLow):
                decoded["Fault"] = "Thermocouple temperature is too low"

            elif (FaultVoltageOutsideRange):
                decoded["Fault"] = "The input voltage is negative or greater than VDD"

            elif (FaultOpenCircuit):
                decoded["Fault"] = "An open circuit such as broken thermocouple wires has been detected"
        return json.dumps(decoded)
    
    def DOWNLINK_ACK(self, bytes):
        decoded = {}
        decoded["Event"] = "Downlink Acknowledge"

        DownLinkEvent = bytes[2]
        if(DownLinkEvent == 1):
            DownlinkEventDescription = "Message Invalid"
        else:
            DownlinkEventDescription = "Message Valid"
        
        decoded["Downlink"] = DownlinkEventDescription
        
        return json.dumps(decoded)

        
    def Hex(self,decimal):
        return f'{decimal:02X}'
            
    def Convert(self, number, mode):
        if mode == 0:
            return number - 256 if number > 127 else number
        elif mode == 1:
            return -((number - 128) if number > 127 else number)

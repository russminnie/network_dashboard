def get_message_type_map():
    return {
        0x00: "Reset Message",
        0x01: "Supervisory Message",
        0x02: "Tamper Event",
        0x03: "Door/Window Sensor Event",
        0x06: "Push Button Sensor Event",
        0x07: "Dry Contact Sensor Event",
        0x08: "Water Leak Sensor Event",
        0x09: "Thermistor Temperature Sensor Event",
        0x0A: "Tilt Sensor Event",
        0x0D: "Air Temperature and Humidity Sensor Event",
        0x0E: "Accelerometer-based Movement Sensor Event",
        0x0F: "High-precision Tilt Sensor Event",
        0x10: "Ultrasonic Distance Sensor Event",
        0x11: "4-20mA Current Loop Sensor Event",
        0x13: "Thermocouple Temperature Sensor Event",
        0x14: "Voltmeter Sensor Event",
        0x19: "CMOS Temperature Sensor Event",
        0xFA: "Device Info Message",
        0xFB: "Link Quality Message",
        0xFF: "Downlink Received Acknowledgement Message",
        # Add additional mappings as needed
    }

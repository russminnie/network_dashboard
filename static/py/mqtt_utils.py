import paho.mqtt.client as mqtt
import base64
import json
import paho.mqtt.publish as publish
from static.data.config import message_type_map

message_buffer = []
mqtt_client = mqtt.Client()


def decode_sensor_data(data):
    padding = '=' * ((4 - len(data) % 4) % 4)
    base64_data_padded = data + padding

    try:
        decoded_bytes = base64.b64decode(base64_data_padded)
        protocol_version = decoded_bytes[0] >> 4
        packet_counter = decoded_bytes[0] & 0x0F
        message_type = decoded_bytes[1]
        payload = decoded_bytes[2:]

        decoded_message = {
            'protocol_version': protocol_version,
            'packet_counter': packet_counter,
            'message_type': message_type_map.get(message_type, f"Unknown ({message_type})")
        }

        if message_type == 0x08:
            decoded_message.update({
                'water_status': 'Water present' if payload[0] == 0x00 else 'Water not present',
                'Measurement (0-255)': payload[1]
            })
        elif message_type == 0x00:
            decoded_message['reset_info'] = payload[:6].hex()
        elif message_type == 0x01:
            battery_voltage_hex = format(payload[2], '02x')
            battery_voltage = int(battery_voltage_hex) * 0.1
            decoded_message.update({
                'device_error_code': payload[0],
                'current_sensor_state': payload[1],
                'battery_voltage_hex': battery_voltage_hex,
                'battery_voltage': battery_voltage
            })
        else:
            decoded_message['payload'] = payload.hex()

        return decoded_message
    except (base64.binascii.Error, IndexError, ValueError) as e:
        return f"Error decoding Base64 or interpreting the payload: {e}"


def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe(userdata['topic'])


def on_message(client, userdata, msg):
    global message_buffer
    topic = msg.topic
    message = msg.payload.decode()
    print(f"Received message: {message}")
    try:
        data = json.loads(message)
        if isinstance(data, dict) and 'data' in data:
            data['data_decoded'] = decode_sensor_data(data['data'])
        message_buffer.append({
            'type': 'json',
            'topic': topic,
            'data': data
        })
    except json.JSONDecodeError:
        message_buffer.append({
            'type': 'text',
            'topic': topic,
            'data': message
        })
    except TypeError as e:
        print(f"TypeError: {e}")
        message_buffer.append({
            'type': 'error',
            'topic': topic,
            'data': f"Error processing message: {e}"
        })
    if len(message_buffer) > 150:
        message_buffer.pop(0)


def send_downlink(data, broker_ip):
    print(f"Using broker_ip in send_downlink: {broker_ip}")  # Debug log

    if not broker_ip:
        return {"error": "Invalid host."}, 500

    topic = data['topic']
    enable_water_present = int(data['enableWaterPresent'])
    enable_water_not_present = int(data['enableWaterNotPresent'])
    threshold = int(data['threshold'])
    restoral = int(data['restoral'])

    enable_events = ((not enable_water_present) << 1) | (not enable_water_not_present)

    downlink_message = [
        0x08,  # Water sensor event
        enable_events,
        threshold,
        restoral,
        0x00, 0x00, 0x00, 0x00
    ]

    downlink_message_base64 = base64.b64encode(bytes(downlink_message)).decode('utf-8')

    payload = json.dumps({'data': downlink_message_base64})

    print("Sending downlink message:", payload)  # Debug log

    try:
        publish.single(topic, payload, hostname=broker_ip)
        return {"message": "Downlink message sent successfully"}, 200
    except Exception as e:
        print(f"Error sending downlink: {e}")  # Debug log
        return {"error": str(e)}, 500

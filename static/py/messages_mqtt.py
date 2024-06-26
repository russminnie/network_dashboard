import json, base64

__all__ = ['decode_sensor_data', 'on_connect', 'on_message', 'get_message_buffer', 'message_buffer', 'mqtt_client']
message_buffer = []
mqtt_client = None

get_message_buffer = lambda: message_buffer


def decode_sensor_data(data, message_type_map):
    # Ensure the Base64 data is correctly padded
    padding = '=' * ((4 - len(data) % 4) % 4)
    base64_data_padded = data + padding
    try:
        decoded_bytes = base64.b64decode(base64_data_padded)
        # Decode according to the specified protocol
        protocol_version = decoded_bytes[0] >> 4
        packet_counter = decoded_bytes[0] & 0x0F
        message_type = decoded_bytes[1]
        payload = decoded_bytes[2:]

        decoded_message = {
            'protocol_version': protocol_version,
            'packet_counter': packet_counter,
            'message_type': message_type_map.get(message_type, f"Unknown ({message_type})")
        }

        if message_type == 0x08:  # Water sensor event
            water_status = payload[0]
            conductance = payload[1]
            decoded_message.update({
                'water_status': 'Water present' if water_status == 0x00 else 'Water not present',
                'Measurement (0-255)': conductance
            })
        elif message_type == 0x00:  # Reset message
            reset_info = payload[:6]
            decoded_message.update({
                'reset_info': reset_info.hex()
            })
        elif message_type == 0x01:  # Supervisory message
            battery_voltage = payload[0]
            decoded_message.update({
                'battery_voltage': battery_voltage
            })
        elif message_type == 0x02:  # Tamper event
            tamper_status = payload[0]
            decoded_message.update({
                'tamper_status': 'Tampered' if tamper_status else 'Not tampered'
            })
        elif message_type == 0x03:  # Door/Window sensor event
            door_status = payload[0]
            decoded_message.update({
                'door_status': 'Open' if door_status else 'Closed'
            })
        # Add decoding logic for other message types as needed

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
    print(f"Received message: {message}")  # Debug statement
    try:
        data = json.loads(message)
        if isinstance(data, dict) and 'data' in data:
            decoded_message = decode_sensor_data(data['data'])
            data['data_decoded'] = decoded_message
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

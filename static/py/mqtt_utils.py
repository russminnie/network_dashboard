"""
Authors: Benjamin Lindeen, Austin Jacobson, Bryan Tran
This file contains functions to decode the payload received from the sensor and to send downlink messages to the sensor.
This file is used by and called by server.py.
"""

"""
Importing the required libraries.
"""

from datetime import datetime, timezone
import paho.mqtt.client as mqtt
import base64
import json
import paho.mqtt.publish as publish
from static.data.config import message_type_map
from static.py.radiobridgev3 import Decoder

from queue import Queue

# message_buffer = []

message_buffer = Queue()

mqtt_client = mqtt.Client()

sensor_list = []

rb_data_decoded = {}

rb_decoder = Decoder()

"""
Following functions are used to connect to the MQTT broker and subscribe to the topic.
"""


def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe(userdata['topic'])


def on_message(client, userdata, msg):
    global message_buffer, sensor_list
    
    topic = msg.topic

    message = msg.payload.decode()
    
    print(f"BT - Received message: {message}")
    
    try:
        # BT - message is converted to dict
        data = json.loads(message)
        print('\n')
        print('===================================')
        print('BT - Topic: {}'.format(topic))
        print('===================================')
        print('\n')
        print('BT - data: {}'.format(data))
        if 'up' in topic and data['data']:
            
            decoded_bytes = base64.b64decode(data['data'])
            print('BT - hex: {}'.format(decoded_bytes.hex()))
            rb_data_decoded = rb_decoder.decodePayload(data,decoded_bytes)
            print('BT - rb_data_decoded: {}'.format(type(rb_data_decoded)))
            print('\n')
            print('=============================================================')
            print('BT - radiobridge data decoded: {}'.format(rb_data_decoded))
            print('=============================================================')
            print('\n')
                     
            # BT - Adding rb_data_decoded to data
            data['data_decoded'] = rb_data_decoded


        # BT - Add time stamp for these below topic
        if any(substring in topic for substring in ['geolocation', 'packet_sent', 'packet_recv', 'cleared', 'join_request', 'mac_sent', 'join', 'recv','down_queued','down']):

            # If there is no timestamp, generate one
            timeStamp1 = datetime.now(timezone.utc).isoformat()
            data['time'] = timeStamp1



        # print('BT - message_buffer: {}'.format(json.dumps(list(message_buffer.queue))))

        message_buffer.put({
            'type': 'json',
            'topic': topic,
            'data': data
        })
        print('\n')
        print('=======================================================================')        
        print('BT - message_buffer length: {}'.format(message_buffer.qsize()))
        print('=======================================================================')
        print('\n')
        
    except json.JSONDecodeError:
        message_buffer.put({
            'type': 'text',
            'topic': topic,
            'data': message
        })
    except TypeError as e:
        print(f"TypeError: {e}")
        message_buffer.put({
            'type': 'error',
            'topic': topic,
            'data': f"Error processing message: {e}"
        })
        
    # BT - If the queue exceeds 150 messages, remove the oldest one
    if message_buffer.qsize() > 150:
        message = message_buffer.get()
        # print(f'Removed message: {message}')  # Print the message


"""
Following function is used to configure a sensor downlink message.
"""


def send_downlink(data, broker_ip):
    
    print(f"Using broker_ip in send_downlink: {broker_ip}")

    if not broker_ip:
        return {"error": "Invalid host."}, 500

    # Check if required keys are present
    if 'topic' not in data or 'data' not in data:
        return {"error": "Missing required keys: 'topic' or 'data'"}, 400
    
    topic = data['topic'] 
    payload = data['data']
    
    # Wrap payload in JSON
    json_payload = json.dumps({
        "data": payload,
        "port": data['port']
    })
    
    publish.single(topic, payload=json_payload, hostname=broker_ip)

    return {"message": "Downlink message sent successfully"}, 200


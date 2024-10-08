"""
Authors: Benjamin Lindeen, Austin Jacobson, Bryan Tran
This file is used to create a Flask server. This will serve all of the HTML pages.
Running this file will enable you to interact with the MQTT broker and send downlink messages to the sensors.
"""

"""
Importing the required libraries.
"""
from flask import Flask, jsonify, request, render_template, send_file, Response, redirect, url_for,session
import json, os, subprocess
import logging
from paho.mqtt import client as mqtt
from datetime import datetime

from static.py.mqtt_utils import mqtt_client, on_connect, on_message, message_buffer, send_downlink, sensor_list

"""
Creating the Flask app and setting the template and static directories.
"""
app = Flask(__name__, template_folder='templates', static_folder='static')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

"""
instantiate the MQTTHandler class to store the MQTT client and broker IP
"""


class MQTTHandler:
    def __init__(self):
        self.client = None
        self.broker_ip = None
        self.upload_buffer = []


mqtt_handler = MQTTHandler()

"""
Following renders the HTML pages in the templates directory.
"""

@app.route('/upload_messages')
def upload_messages():
    if 'username' in session:
        return render_template('upload_messages.html')
    else:
        return redirect(url_for('login')) 


@app.route('/downlink')
def downlink():

    if 'username' in session:
        ###########################
        # BT - Get all the deveui.
        ###########################
        list_of_deveuis = []

        for _ in range(message_buffer.qsize()):

            # Get an item from the queue without removing it
            m = message_buffer.queue[_]  # Accessing the item by index
            
            # Check if the 'deveui' key exists in the expected structure
            if 'data' in m and 'deveui' in m['data']:
                list_of_deveuis.append({
                    'deveui': m['data']['deveui'],
                })

        # Create a set to track unique 'deveui' values
        seen_deveuis = set()

        # Create a new list to store unique entries
        unique_bt_list = []

        # Loop through the original list and filter out duplicates
        for item in list_of_deveuis:
            deveui = item['deveui']
            if deveui not in seen_deveuis:
                unique_bt_list.append(item)
                seen_deveuis.add(deveui)
        print('BT - list of deveui: {}'.format(unique_bt_list))
        return render_template('downlinks.html', list_of_deveuis=unique_bt_list)
    else:
        return redirect(url_for('login')) 


"""
Following is used to connect to the MQTT broker.
"""


@app.route('/connect', methods=['POST'])
def connect():

    if 'username' in session:

        global mqtt_client, broker_ip
        data = request.json
        broker_ip = data['broker']
        port = int(data['port'])
        topic = data['topic']
        print(f"Setting broker_ip to: {broker_ip}")

        if mqtt_client is not None:
            mqtt_client.disconnect()

        mqtt_client = mqtt.Client(userdata={'topic': topic})
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message


        try:
            mqtt_client.connect(broker_ip, port, 60)
            mqtt_client.loop_start()
            return jsonify({"message": "Connected to MQTT broker"}), 200
        except Exception as e:
            # Log the error message
            print(f"Error connecting to MQTT broker: {e}")
            return jsonify({"error": f"Could not connect to MQTT broker: {str(e)}"}), 500
    else:
        return redirect(url_for('login'))  
    
"""
Following used for receiving messages from the MQTT broker, storing them in the message buffer and displaying them.
"""
@app.route('/messages', methods=['GET'])
def get_messages():
    if 'username' in session:
        filter_type = request.args.get('filter', '').lower()
        filtered_messages = []

        for _ in range(message_buffer.qsize()):
            m = message_buffer.queue[_]  # Access the message from the buffer

            # Check if the filter term matches topic, type, deveui, or any part of data_decoded
            deveui_match = (
                m['type'] == 'json' and
                'deveui' in m['data'] and
                filter_type in m['data']['deveui'].lower()
            )
            data_decoded_match = (
                m['type'] == 'json' and
                'data_decoded' in m['data'] and
                any(filter_type in str(value).lower() for key, value in m['data']['data_decoded'].items())
            )

            if (filter_type in m['topic'].lower() or
                filter_type in m['type'].lower() or
                deveui_match or
                data_decoded_match):
                filtered_messages.append({
                    'topic': m['topic'],
                    'type': m['type'],
                    'data': m['data']
                })

        return jsonify(messages=filtered_messages)  # Return the filtered messages as JSON
    else:
        return redirect(url_for('login'))

"""
Following is used to dump the messages in the message buffer to a JSON file and import messages from a JSON file.
"""


@app.route('/dump_messages')
def dump_messages():
    if 'username' in session:
        data_json = json.dumps(list(message_buffer.queue), indent=4)
        response = Response(data_json, content_type='application/json; charset=utf-8')
        filename_json = f'mqttmessages{datetime.now().strftime("%Y-%m-%d_%H-%M-%S")}.json'
        response.headers['Content-Disposition'] = 'attachment; filename=' + filename_json
        return response
    else:
        return redirect(url_for('login')) 


"""
Following is used to import messages from a JSON file.
"""


@app.route('/import_messages', methods=['GET','POST'])
def import_messages():

    if 'username' in session:

        print('BT - User submit the upload button...')
        if 'file' not in request.files:
            return render_template('error.html', message='No file part')
        file = request.files['file']
        if file.filename == '':
            return render_template('error.html', message='No selected file')
        if file:
            try:
                print('BT - loading the receiving file to json format...')
                imported_data = json.load(file)
                if not isinstance(imported_data, list):
                    return render_template('error.html', message='Invalid JSON file')

                mqtt_handler.upload_buffer = imported_data
                print('BT - Data json: {}'.format(imported_data))
                return redirect(url_for('upload_messages'))
            except json.JSONDecodeError:
                return render_template('error.html', message='Invalid JSON file')
    else:
        return redirect(url_for('login')) 


"""
Following routes is used to upload messages from JSON files to the message buffer list.
"""


@app.route('/upload', methods=['GET'])
def upload():

    if 'username' in session:
        filter_type = request.args.get('filter', '')
        filtered_messages = []
        for m in mqtt_handler.upload_buffer:
            if not filter_type or (
                    m['type'] == 'json' and
                    isinstance(m['data'], dict) and
                    'data_decoded' in m['data'] and
                    isinstance(m['data']['data_decoded'], dict) and
                    m['data']['data_decoded'].get('message_type') == filter_type):
                filtered_messages.append({
                    'topic': m['topic'],
                    'type': m['type'],
                    'data': m['data']
                })
        return jsonify(messages=filtered_messages)
    else:
       return redirect(url_for('login')) 


"""
Following is used to send downlink messages to the MQTT broker.
"""
@app.route('/send_downlink', methods=['POST'])
def send_downlink_route():

    if 'username' in session:
        global broker_ip
        print(f"Using broker_ip in send_downlink_route: {broker_ip}")
        data = request.json
        print("Received downlink request:", data)

        response, status_code = send_downlink(data, broker_ip)
        print("Send downlink response:", response, "Status code:", status_code)
        return jsonify(response), status_code
    else:
        return redirect(url_for('login')) 
"""
Following is used to get the list of sensors.
"""


@app.route('/get_sensors', methods=['GET'])
def get_sensors():

    if 'username' in session:
        global sensor_list
        print(f"Sensor list: {sensor_list}")
        return jsonify({'sensors': sensor_list})
    
    else:
        return redirect(url_for('login'))
""


########################################################################
# BT - Authentication
########################################################################

app.secret_key = 'your_secret_key'  # Required for session management

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':

        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        ipaddress = data.get('ip')
        
        # BT - Authenticate the user - comment out for testing 
        auth_result = authenticate_user(username, password,ipaddress)

        # BT - This is for testing. Uncomment for testing
        # auth_result = 'success'
        
        if auth_result == 'success':
            # Store user in session
            session['username'] = username  

            return jsonify({'status': 'ok', 'redirect': url_for('index')})
        
        else:

            return jsonify({'status': 'failed', 'error': 'Invalid credentials'}), 401

    # If it's a GET request, render the login page
    return render_template('login.html')


# Index route
@app.route('/')
def index():
    if 'username' in session:
        return render_template('index.html', username=session['username'])
    else:
        # Redirect to login if not authenticated
        return redirect(url_for('login'))  

def authenticate_user(username, password,ip):
    try:
        command = [
            'curl',
            '-k', 
            '-X', 'POST',  
            '-H', 'Content-Type: application/json',
            f'https://{ip}/api/login',
            '-d', f'{{"username": "{username}", "password": "{password}"}}'
        ]
        result = subprocess.run(command, capture_output=True, text=True)

        # Check if the command succeeded
        if result.returncode == 0:
            try:
                response_data = json.loads(result.stdout)
                
                # Extract the "status" field
                # Default to 'Unknown status' if 'status' is not found
                status = response_data.get('status', 'Unknown status') 
                print(f"Status: {status}")
                return status
                
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON: {e}")
        else:
            print(f"Command failed with return code {result.returncode}")

    except Exception as e:
        return {'status': 'failed', 'error': str(e)}

# Route to logout
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))


# Catch-all route to handle unmatched routes and redirect to login
@app.errorhandler(404)
def page_not_found(e):
    return redirect(url_for('login'))

"""
Following used to run the Flask app.

"""
if __name__ == '__main__':

    STATUS_FILE = 'status.json'

    message = 'https://0.0.0.0:5000'

    status = {'pid': os.getpid(), 'AppInfo': message}
    
    # Write to the status.json with the message
    with open(STATUS_FILE, 'w') as file:
        json.dump(status, file, indent=2)

    # BT - Comment out for tesing.
    app.run(host="0.0.0.0", debug=True, port=5000, ssl_context=('certs/cert.pem', 'certs/key.pem'))
    # BT - Uncomment for testing.
    # app.run(host="0.0.0.0", debug=True, port=5000)

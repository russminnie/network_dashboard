"""
Authors: Benjamin Lindeen, Austin Jacobson, Bryan Tran
This file is used to create a Flask server. This will serve all of the HTML pages.
Running this file will enable you to interact with the MQTT broker and send downlink messages to the sensors.
"""

"""
Importing the required libraries.
"""
from flask import Flask, jsonify, request, render_template, send_file, Response, redirect, url_for,session
import json, os, subprocess, threading, time, signal
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

@app.route('/animation_load_page')
def animation_load_page():
    if 'username' in session:
        filter_type = request.args.get('filter', '').lower()
        return render_template(f"{filter_type}.html")
    else:
        return redirect(url_for('login'))

####################################################################################
# BT - Function to get the deveui to populate the select - charts and animation.
####################################################################################
def getDevEui():

    ###########################
    # BT - Get all the deveui.
    ###########################
    list_of_deveuis = []
    excluded_events = {'reset', 'supervisory', 'device_info', 'contact','downlink_ack','link_quality'}

    for _ in range(message_buffer.qsize()):

        # Get an item from the queue without removing it
        m = message_buffer.queue[_]  # Accessing the item by index
        
        # Check if the necessary keys exist in the expected structure
        if 'data' in m and 'deveui' in m['data'] and 'data_decoded' in m['data']:
            event = m['data']['data_decoded'].get('event')
            
            # Skip if the event is in the excluded list
            if event in excluded_events:
                continue
            
            # Append deveui and event if it passes the filter
            deveui = m['data']['deveui']
            list_of_deveuis.append({
                'deveui': f"{deveui} - {event if event else 'No Event'}",  # Format deveui - event
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

    return unique_bt_list



@app.route('/animations')
def animations():
    if 'username' in session:

        unique_bt_list = getDevEui()
        return render_template('animations.html', list_of_deveuis=unique_bt_list)
    else:
        return redirect(url_for('login'))


####################################################
# BT - Display the charts.html
####################################################

@app.route('/charts')
def charts():
    if 'username' in session:

        unique_bt_list = getDevEui()
        return render_template('charts.html', list_of_deveuis=unique_bt_list)
    else:
        return redirect(url_for('login'))



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

        unique_bt_list = getDevEui()
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

        # Check if the filter matches the format 'deveui - event'
        if ' - ' in filter_type:
            deveui_filter, event_filter = map(str.strip, filter_type.split(' - '))
        else:
            deveui_filter = filter_type
            event_filter = None

        for _ in range(message_buffer.qsize()):
            m = message_buffer.queue[_]

            # Initialize formatted_time to an empty string to avoid the UnboundLocalError
            formatted_time = ''

            # Extract time portion if current_time is available and format it as hh:mm
            if 'current_time' in m['data']:
                message_time = m['data']['current_time']
                formatted_time = message_time[11:16]  # Extract the hh:mm portion

            # Check if deveui and event match the filter when 'deveui - event' format is used
            deveui_match = (
                m['type'] == 'json' and
                'deveui' in m['data'] and
                deveui_filter == m['data']['deveui'].lower()
            )
            event_match = (
                m['type'] == 'json' and
                'data_decoded' in m['data'] and
                'event' in m['data']['data_decoded'] and
                event_filter and event_filter == m['data']['data_decoded']['event'].lower()
            )

            # General matching for topic, type, deveui, data_decoded, or time
            general_deveui_match = (
                m['type'] == 'json' and
                'deveui' in m['data'] and
                deveui_filter in m['data']['deveui'].lower()
            )
            data_decoded_match = (
                m['type'] == 'json' and
                'data_decoded' in m['data'] and
                any(deveui_filter in str(value).lower() for key, value in m['data']['data_decoded'].items())
            )
            time_match = deveui_filter in formatted_time

            # Append to filtered messages based on the matching criteria
            if ((deveui_match and event_match) or  # Matches 'deveui - event' format
                filter_type in m['topic'].lower() or
                filter_type in m['type'].lower() or
                general_deveui_match or
                data_decoded_match or
                time_match):
                filtered_messages.append({
                    'topic': m['topic'],
                    'type': m['type'],
                    'data': m['data']
                })

        return jsonify(messages=filtered_messages)
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
                imported_data = json.load(file)
                if not isinstance(imported_data, list):
                    return render_template('error.html', message='Invalid JSON file')

                mqtt_handler.upload_buffer = imported_data
                
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

@app.route('/config_time')
def config_time():
    if 'username' in session:
        return render_template('date_time.html')
    else:
        return redirect(url_for('login'))

# BT - Set system time and restart the server.
@app.route('/setTime',methods=['POST'])
def setTime():
    

    data = request.get_json()
    date = data.get('selectedDate')
    selected_time = data.get('selectedTime')
    time_zone = data.get('selectedTimeZone')
    seconds = data.get('seconds')

    config_time_zone = json.dumps({"timeZone": time_zone})

    # BT - Step 1: Convert the date from YYYY-MM-DD to MM/DD/YYYY
    formatted_date = datetime.strptime(date, "%Y-%m-%d").strftime("%m/%d/%Y")

    # BT - Step 2: Combine the time and seconds to form HH:MM:SS
    formatted_time = f"{selected_time}:{seconds}"

    # BT - Step 3: Combine the formatted date and the complete time
    datetime_str = f"{formatted_date} {formatted_time}"

    # BT - Step 4: Create the JSON object
    data = json.dumps({"datetime": datetime_str})

    set_time_zone = do_command_line('PUT','sntp',config_time_zone)
  
    if set_time_zone['status'] == 'success':
        res = do_command_line('PUT','system',data)
        save_res = do_command_line('POST','save_apply','','save_apply')

        if save_res['status'] == 'success':

            # BT - Function to restart the server after a delay
            def delayed_restart():
                time.sleep(5)  # Delay to allow the response to complete
                
                
                # Get the process ID (PID) of the current server process (this process)
                current_pid = os.getpid()
                print(f"BT - Current PID: {current_pid}")
                
                try:
                    os.system('./Start restart')

                except Exception as e:
                    print(f"BT - Failed to restart app: {e}")
                
                # Find the existing process by the server.py file or by name
                # Kill the current process gracefully
                try:
                    os.kill(current_pid, signal.SIGTERM)  # Send SIGTERM to terminate gracefully
                    print(f"Terminating process with PID {current_pid}")
                except Exception as e:
                    print(f"Failed to terminate process: {e}")
                

            ########################################################################################
            # BT - Start the background thread for server restart. This thread will be separate
            #      and running in the background. It will sleep for 5 secs and then will run the
            #      the command to restart the flask server.
            #      The reason we do this is that, we want the server send the response back to 
            #      notity the user that - we will restart the server in 5secs.
            ########################################################################################
            threading.Thread(target=delayed_restart).start()

            # Return a JSON response to the client
            return jsonify({
                "message": "The server will restart shortly. Please log in again."
            })

    return jsonify({"message": "Error! could set time and date"})



# Catch-all route to handle unmatched routes and redirect to login
@app.errorhandler(404)
def page_not_found(e):
    return redirect(url_for('login'))

    
# BT - Send command line

def do_command_line(method,endpoint, data='',save_apply=''):
    
    try:

        if method == 'GET':
        
            command = [
                'curl', 
                '-X', f'{method}',  # Change to POST request
                '-H', 'Content-Type: application/json',  # Ensure content type is JSON
                '-d', '',  # Data to send in the POST request
                f'http://127.0.0.1/api/{endpoint}'
            ]

        elif save_apply == 'save_apply':

            command = [
                'curl', 
                '-X', f'{method}',  # Change to POST request
                '-H', 'Content-Type: application/json',  # Ensure content type is JSON
                '-d', '',  # Data to send in the POST request
                f'http://127.0.0.1/api/command/{endpoint}'
            ]
        else:

            command = [
                'curl', 
                '-X', f'{method}',  # Change to POST request
                '-H', 'Content-Type: application/json',  # Ensure content type is JSON
                '-d', data,  # Data to send in the POST request
                f'http://127.0.0.1/api/{endpoint}'
            ]



        result = subprocess.run(command, capture_output=True, text=True)

        # Check if the command succeeded
        if result.returncode == 0:
            try:
                response_data = json.loads(result.stdout)
                return response_data
                
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON: {e}")
        else:
            print(f"Command failed with return code {result.returncode}")

    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
    

"""
Following used to run the Flask app.

"""
if __name__ == '__main__':
    
    messages = []
    
    get_eth0_ip = do_command_line('GET',"/ni/nis/0")
    get_br0_ip = do_command_line('GET','/ni/nis/6')
    get_ppp0_ip = do_command_line('GET','/ni/nis/3')
    
    if get_eth0_ip['result']['ipv4']['ip'] != "":
        # BT - eth0 is setup.
        eth0_ip = get_eth0_ip['result']['ipv4']['ip']
        messages.append("https://" + eth0_ip + ":5000")
    else:
        br0_ip = get_br0_ip['result']['ipv4']['ip']
        messages.append("https://" + br0_ip + ":5000")

    if get_ppp0_ip['result']['ipv4']['ip'] != "":
        ppp0_ip = get_ppp0_ip['result']['ipv4']['ip']
        messages.append("https://" + ppp0_ip + ":5000")
        
    displaying_messages = "Listenning at: "
        
    for item in messages:
        displaying_messages += item + ", "
                
    clean_up_messages = displaying_messages.rstrip(", ")

    STATUS_FILE = 'status.json'

    status = {'pid': os.getpid(), 'AppInfo': clean_up_messages}
    
    # Write to the status.json with the message
    with open(STATUS_FILE, 'w') as file:
        json.dump(status, file, indent=2)

    # BT - Debug false
    app.run(host="0.0.0.0", debug=False, port=5000, ssl_context=('certs/cert.pem', 'certs/key.pem'))


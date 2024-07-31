from flask import Flask, jsonify, request, render_template, send_file, Response, redirect, url_for
import json
import logging
from paho.mqtt import client as mqtt
from datetime import datetime

from static.py.mqtt_utils import mqtt_client, on_connect, on_message, message_buffer, send_downlink, sensor_list

app = Flask(__name__, template_folder='templates', static_folder='static')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MQTTHandler:
    def __init__(self):
        self.client = None
        self.broker_ip = None
        self.upload_buffer = []


mqtt_handler = MQTTHandler()


@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', message='Page not found'), 404


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/mqtt_messages')
def mqtt_messages():
    return render_template('mqtt_messages.html')


@app.route('/upload_messages')
def upload_messages():
    return render_template('upload_messages.html')


@app.route('/downlink')
def downlink():
    return render_template('downlinks.html')


@app.route('/connect', methods=['POST'])
def connect():
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
    mqtt_client.connect(broker_ip, port, 60)
    mqtt_client.loop_start()

    return jsonify({"message": "Connected to MQTT broker"})


@app.route('/messages', methods=['GET'])
def get_messages():
    filter_type = request.args.get('filter', '')
    filtered_messages = []
    for m in message_buffer:
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


@app.route('/dump_messages')
def dump_messages():
    data_json = json.dumps(message_buffer, indent=4)
    response = Response(data_json, content_type='application/json; charset=utf-8')
    filename_json = f'mqttmessages{datetime.now().strftime("%Y-%m-%d_%H-%M-%S")}.json'
    response.headers['Content-Disposition'] = 'attachment; filename=' + filename_json
    return response


@app.route('/import_messages', methods=['POST'])
def import_messages():
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

            global upload_buffer
            upload_buffer = imported_data
            return redirect(url_for('upload_messages'))
        except json.JSONDecodeError:
            return render_template('error.html', message='Invalid JSON file')


@app.route('/upload', methods=['GET'])
def upload():
    filter_type = request.args.get('filter', '')
    filtered_messages = []
    for m in upload_buffer:
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


@app.route('/send_downlink', methods=['POST'])
def send_downlink_route():
    global broker_ip
    print(f"Using broker_ip in send_downlink_route: {broker_ip}")
    data = request.json
    print("Received downlink request:", data)
    required_keys = ['topic', 'sensor_type']
    missing_keys = [key for key in required_keys if key not in data]

    if missing_keys:
        print(f"Missing required keys: {missing_keys}")
        return jsonify({"error": f"Missing required keys: {missing_keys}"}), 400

    response, status_code = send_downlink(data, broker_ip)
    print("Send downlink response:", response, "Status code:", status_code)
    return jsonify(response), status_code


@app.route('/get_sensors', methods=['GET'])
def get_sensors():
    global sensor_list
    print(f"Sensor list: {sensor_list}")  # Debug log
    return jsonify({'sensors': sensor_list})


if __name__ == '__main__':
    app.run(debug=True, port=5000)

from flask import Flask, jsonify, request, render_template
from paho.mqtt import client as mqtt

from static.py.mqtt_utils import mqtt_client, on_connect, on_message, message_buffer, send_downlink

app = Flask(__name__)

# Declare mqtt_client and broker_ip as global at the module level
mqtt_client = None
broker_ip = None


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/mqtt_messages')
def mqtt_messages():
    return render_template('mqtt_messages.html')


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

    print(f"Setting broker_ip to: {broker_ip}")  # Debug log

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
                'data_decoded' in m['data'] and
                m['data']['data_decoded'].get('message_type') == filter_type):
            filtered_messages.append({
                'topic': m['topic'],
                'type': m['type'],
                'data': m['data']
            })
    return jsonify(messages=filtered_messages)


@app.route('/dump_messages', methods=['GET'])
def dump_messages():
    try:
        # Convert message buffer to JSON string
        messages_json = jsonify(messages=message_buffer).get_data(as_text=True)
        # Create a response with the JSON data, setting appropriate headers for file download
        response = app.response_class(messages_json, mimetype='application/json')
        response.headers['Content-Disposition'] = 'attachment; filename=message_buffer.json'
        return response
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/send_downlink', methods=['POST'])
def send_downlink_route():
    global broker_ip
    print(f"Using broker_ip in send_downlink_route: {broker_ip}")  # Debug log
    data = request.json
    print("Received downlink request:", data)  # Debug log
    response, status_code = send_downlink(data, broker_ip)
    print("Send downlink response:", response, "Status code:", status_code)  # Debug log
    return jsonify(response), status_code


if __name__ == '__main__':
    app.run(debug=True, port=5000)

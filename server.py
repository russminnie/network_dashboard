# Multi-Tech Systems Inc, 2024
#
# Inspiration from Russel Ndip
# Authors Benjamin Lindeen, Austin Jacobson

from flask import Flask, request, render_template, redirect, url_for, jsonify
from flask_restful import Api
from werkzeug.security import generate_password_hash
import paho.mqtt.client as mqtt
from static.data.tooltips import *
from static.data.message_type_map import *
from py.messages_lora import *
from py.messages_mqtt import *

app = Flask(__name__)
api = Api(app)

users = []


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/users')
def list_users():
    return render_template('users.html', users=users)


@app.route('/users/add', methods=['GET', 'POST'])
def add_user():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        for user in users:
            if user['username'] == username:
                return {'message': 'User already exists'}, 400

        hashed_password = generate_password_hash(password, method='sha256')
        users.append({'username': username, 'password': hashed_password})
        return redirect(url_for('list_users'))
    return render_template('add_user.html')


@app.route('/users/delete/<string:username>', methods=['POST'])
def delete_user(username):
    global users
    users = [user for user in users if user['username'] != username]
    return redirect(url_for('list_users'))


@app.route('/lora_messages')
def list_lora_messages():
    lora_messages = get_lora_messages()
    return render_template('lora_messages.html', lora_messages=lora_messages)


@app.route('/lora_messages/add', methods=['GET', 'POST'])
def add_lora_message():
    lora_messages = get_lora_messages()
    if request.method == 'POST':
        deviceName = request.form['deviceName']
        deveui = request.form['deveui']
        appeui = request.form['appeui']
        data = request.form['data']
        size = request.form['size']
        timestamp = request.form['timestamp']
        sqn = request.form['sqn']

        lora_messages.append({
            'deviceName': deviceName,
            'deveui': deveui,
            'appeui': appeui,
            'data': data,
            'size': size,
            'timestamp': timestamp,
            'sqn': sqn
        })
        return redirect(url_for('list_lora_messages'))
    return render_template('add_lora_message.html')


@app.route('/lora_messages/<string:deveui>')
def view_lora_message(deveui):
    lora_messages = get_lora_messages()
    for message in lora_messages:
        if message['deveui'] == deveui:
            return render_template('view_lora_message.html', message=message)
    return {'message': 'Device not found'}, 404


@app.route('/mqtt_base', methods=['GET', 'POST'])
def mqtt_base():
    tooltips = get_tooltips()
    message_buffer = get_message_buffer()
    return render_template('mqtt_base.html', messages=message_buffer, tooltips=tooltips)


@app.route('/connect', methods=['POST'])
def connect(on_connect, on_message):
    global mqtt_client
    broker = request.form['broker']
    port = int(request.form['port'])
    topic = request.form['topic']

    if mqtt_client is not None:
        mqtt_client.disconnect()

    mqtt_client = mqtt.Client(userdata={'topic': topic})
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.connect(broker, port, 60)
    mqtt_client.loop_start()

    return redirect(url_for('mqtt_base'))


@app.route('/messages', methods=['GET'])
def get_messages(message_buffer, tooltips):
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
                'data': m['data'],
                'tooltips': tooltips
            })
    return jsonify(messages=filtered_messages)


@app.route('/send_downlink', methods=['POST'])
def send_downlink():
    global mqtt_client
    content = request.json
    topic = content['topic']
    payload = content['payload']

    # Ensure the payload is correctly formatted
    if len(payload) < 6:
        payload = payload.ljust(6, '0')

    # Convert payload to a byte string
    payload_bytes = bytes.fromhex(payload)

    # Publish downlink message
    mqtt_client.publish(topic, payload_bytes)

    return jsonify({"message": "Downlink message sent"})


api.add_resource(UserList, '/api/users')
api.add_resource(User, '/api/users/<string:identifier>')
api.add_resource(LoraMessageList, '/api/LoraMessage')
api.add_resource(LoraMessage, '/api/LoraMessage/<string:identifier>')

if __name__ == '__main__':
    app.run(debug=True, port=5000)

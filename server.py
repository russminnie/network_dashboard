# Multi-Tech Systems Inc, 2024
#
# Inspiration from Russel Ndip
# Authors Benjamin Lindeen, Austin Jacobson

from flask import Flask, jsonify, request, render_template, redirect, url_for
from flask_restful import Resource, Api, reqparse
from werkzeug.security import generate_password_hash

app = Flask(__name__)
api = Api(app)

users = []
lora_messages = []


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
    return render_template('lora_messages.html', lora_messages=lora_messages)


@app.route('/lora_messages/add', methods=['GET', 'POST'])
def add_lora_message():
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
    for message in lora_messages:
        if message['deveui'] == deveui:
            return render_template('view_lora_message.html', message=message)
    return {'message': 'Device not found'}, 404


class UserList(Resource):
    def get(self):
        return jsonify({'users': users})

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('username', required=True)
        parser.add_argument('password', required=True)
        args = parser.parse_args()

        for user in users:
            if user['username'] == args['username']:
                return {'message': 'User already exists'}, 400

        hashed_password = generate_password_hash(args['password'], method='sha256')
        users.append({'username': args['username'], 'password': hashed_password})
        return {'message': 'User Created', 'data': args}, 201


class User(Resource):
    def get(self, identifier):
        for user in users:
            if user['username'] == identifier:
                return jsonify({'user': user})
        return {'message': 'No user found'}, 404

    def delete(self, identifier):
        global users
        users = [user for user in users if user['username'] != identifier]
        return {'message': 'The user has been deleted'}


class LoraMessageList(Resource):
    def get(self):
        return jsonify({'LoraMessages': lora_messages})

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('deviceName', required=True)
        parser.add_argument('deveui', required=True)
        parser.add_argument('appeui', required=True)
        parser.add_argument('data', required=True)
        parser.add_argument('size', required=True)
        parser.add_argument('timestamp', required=True)
        parser.add_argument('sqn', required=True)
        args = parser.parse_args()

        lora_messages.append(args)
        return {'message': 'Lora Message Added', 'data': args}, 201


class LoraMessage(Resource):
    def get(self, identifier):
        for message in lora_messages:
            if message['deveui'] == identifier:
                return jsonify({'LoraMessage': message})
        return {'message': 'Device not found'}, 404


api.add_resource(UserList, '/api/users')
api.add_resource(User, '/api/users/<string:identifier>')
api.add_resource(LoraMessageList, '/api/LoraMessage')
api.add_resource(LoraMessage, '/api/LoraMessage/<string:identifier>')

if __name__ == '__main__':
    app.run(debug=True, port=5000)

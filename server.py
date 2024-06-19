# Multi-Tech Systems Inc, 2024
#
# Inspiration from Russel Ndip
# Authors Benjamin Lindeen, Austin Jacobson

from flask import Flask, jsonify, render_template, redirect, url_for
from flask_restful import Resource, Api, reqparse
from werkzeug.security import generate_password_hash

app = Flask(__name__)
api = Api(app)

# In-memory storage
users = []
lora_messages = []


@app.route('/')
def index():
    return render_template('home.html')


#### UserList Resource
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


#### User Resource
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


#### LoraMessageList Resource
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


#### LoraMessage Resource
class LoraMessage(Resource):
    def get(self, identifier):
        for message in lora_messages:
            if message['deveui'] == identifier:
                return jsonify({'LoraMessage': message})
        return {'message': 'Device not found'}, 404


# add api routes and endpoints
api.add_resource(UserList, '/users')
api.add_resource(User, '/users/<string:identifier>')
api.add_resource(LoraMessageList, '/LoraMessage')
api.add_resource(LoraMessage, '/LoraMessage/<string:identifier>')

if __name__ == '__main__':
    app.run(port=5000, debug=True)

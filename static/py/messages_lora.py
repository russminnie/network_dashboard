from flask import jsonify
from flask_restful import Resource, reqparse
from werkzeug.security import generate_password_hash

__all__ = ['UserList', 'User', 'LoraMessageList', 'LoraMessage', 'get_lora_messages', 'lora_messages']

lora_messages = []

get_lora_messages = lambda: lora_messages


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

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from data import *
import os, json
from os import environ as env
from dotenv import load_dotenv
from datetime import datetime

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

app = Flask(__name__, static_url_path='/static')

@app.route('/')
def home():
    return render_template('home.html')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=env.get("PORT", 5000))

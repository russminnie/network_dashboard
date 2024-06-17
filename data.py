from dotenv import load_dotenv, find_dotenv
import os, logging, json, requests, time
from datetime import datetime

logging.basicConfig(level=logging.INFO)

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)
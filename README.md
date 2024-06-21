# MultiTech Network Dashboard

[![My Skills](https://skillicons.dev/icons?i=python,flask,js,html,css,github)](https://skillicons.dev)

## Description

This application uses flask and flask extentions to create a simple websever and API in python. For more information
about these libraries used in the app see the docs below

## How to Run Application On conduit

### Project Files

- `server.py`: The main file that runs the Flask server and serves the dashboard.
- `templates/`: Contains the HTML files for the dashboard. Dynamically generated using Jinja2.
- `base.html`: The base HTML file that all other HTML files extend.
- `static/`: Contains the CSS JavaScript and image files for the dashboard. ase.
- `requirements.txt`: Contains the Python libraries required for the project.
- `README.md`: The file you are currently reading.
- other files you can ignore for now.

### Requirements

- Python 3
- Pip

### Installation

```bash
pip install -r requirements.txt
```

### Running the Application

```bash
python3 server.py
```

Or press the run button in your IDE of choice.

# API Documentation

## List all users

### Definition 'GET /users'

**Response**

```json
 [
  {
    "username": "Adam",
    "password": "sharkl139737"
  }
]
```

on success

## Add New User

### Definition 'POST /users'

**Arguments**

"username": string' user name
"password": string' password for user

on success

```
[ { "username": "Adam", "password": "sharkl139737", } ]
```

## Delete a User

### Definition 'DELETE /users'

**Response**

`'message': 'No user found'` if no user found
`{'message': 'The user has been deleted'}` on sucess

## List all LoraMessages

### Definition 'GET /LoraMessage'

**Response**

```json
[
  {
    "deviceName": "TempSensor",
    "deveui": "00-80-00-00-04-01-80-4d",
    "appeeui": "01-01-01-01-01-01-01",
    "data": "SF12BW125",
    "size": 12,
    "timestamp": "2020-09-02T09:02:02.648602Z",
    "sqn": 22
  }
]
```

## Adding a new LoraMessage

### Definition 'POST /LoraMessage'

**Arguments**

"deviceName": string' friendly name for device
"deveui": string' unique device EUI
"appeui": string' app eui
"data": string' network class profile
"size": integer
"timestamp": string'
"sqn": integer

`"message": Lora Message Added", 201` on success

```json
{
  "deviceName": "TempSensor",
  "deveui": "00-80-00-00-04-01-80-4d",
  "appeeui": "01-01-01-01-01-01-01",
  "data": "SF12BW125",
  "size": 12,
  "timestamp": "2020-09-02T09:02:02.648602Z",
  "sqn": 22
}
```

## Lookup LoraMessage details for a specific device

### Definition 'GET /LoraMessage/deveui/'

**Response**
`Lora Message not found` if the LoraMessage does not exists

on success

```json
{
  "LoraMessageName": "TempSensor",
  "deveui": "00-80-00-00-04-01-80-4d",
  "appeeui": "01-01-01-01-01-01-01",
  "data": "SF12BW125",
  "size": 12,
  "timestamp": "2020-09-02T09:02:02.648602Z",
  "sqn": 22
}
```

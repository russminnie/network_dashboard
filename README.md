# MultiTech Network Dashboard

[![My Skills](https://skillicons.dev/icons?i=python,flask,js,html,css,github)](https://skillicons.dev)

## Description

This application uses flask and flask extensions to create a simple webserver and API in python. For more information
about these libraries used in the app see the docs below

## How to Run Application On conduit

### Project Files

- `server.py`: The main file that runs the Flask server and serves the dashboard.
- `templates/`: Contains the HTML files for the dashboard. Dynamically generated using Jinja2.
- `base.html`: The base HTML file that all other HTML files extend.
- `static/`: Contains the CSS JavaScript, Python, data and image files for the dashboard.
- `requirements.txt`: Contains the Python libraries required for the project.
- `README.md`: The file you are currently reading.

### Requirements

- Multitech Gateway
- Web Browser


### Configuring Gateway

- Navigate to the MultiTech Gateway dashboard console in your browser:
    - http://<gateway_ip> (i.e. 192.168.2.1)
        - login with your account
        - navigate to the firewall settings
        - add a new rule for "Input Filter Rules"
        - name the firewall filter rule and accept the rest of the default settings
        - ensure that "Output Filter Rules" has Allow Outbound enabled
- SSH to the gateway in your computers CLI
    - ssh <username>@gateway_ip
    - enter your password
    - navigate to the /etc/mosquitto directory
    - enter the following command:
        ```bash
        sudo nano mosquitto.conf
        ```
    - add a "#" in from of the following lines to the file:
    - "bind_address 127.0.0.1"
    - save and exit nano
    - restart the mosquitto service with the following command:
      ```bash
      /etc/init.d/mosquitto restart
      ```
    - exit the ssh session.
- Remote PC:
    - Install the mosquitto software - https://mosquitto.org/download/
  ```bash
  mosquitto_sub -t lora/+/+ -v -h 192.168.2.1
  ```
    - Then reboot MDot

### Installation

- Through the UI
  - Navigate to **Apps** --> **Custom Apps**
  - Click *Add Custom App*
  - Enter Application Information

  App will take a minute to download and the process can be monited in the **Status and Logs** in the system log.

### Running the Application

-Navigate to your gateways IP:5000 to access the dashboard
  - ex: 192.168.2.1:5000 


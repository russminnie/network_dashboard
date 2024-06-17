# MultiTech Network Dashboard

[![My Skills](https://skillicons.dev/icons?i=python,flask,js,mysql,html,css,github)](https://skillicons.dev)

## Project Files
- `server.py`: The main file that runs the Flask server and serves the dashboard.
- `templates/`: Contains the HTML files for the dashboard. Dynamically generated using Jinja2.
- `static/`: Contains the CSS JavaScript and image files for the dashboard.
- `data.py`: Contains the data processing functions.
- `schema.sql`: Contains the SQL schema for the database.
- `requirements.txt`: Contains the Python libraries required for the project.

## Description
This project is a network dashboard which displays information about income and outgoing traffic from the MultiTech Conduit gateways and their respective IOT devices.

## Requirements
- Python 3.10.12
- Flask 3.0.3

## Setup
1. Clone the repository.
2. Install the required Python libraries using `pip install -r requirements.txt`.

## Usage
1. Run the Flask server using `python server.py`.
2. Open the dashboard in your browser by navigating to `localhost:5000`.
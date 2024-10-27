// When the page loads, connect to the broker and set up the chart
document.addEventListener('DOMContentLoaded', () => {
    // connectToBroker();

    // Check for the sensorSelect element
    const sensorSelectElement = document.getElementById('sensorSelect-animations');

    if (sensorSelectElement) {
        sensorSelectElement.addEventListener('change', (event) => {
            const selectedSensorText = sensorSelectElement.options[sensorSelectElement.selectedIndex].textContent;
            localStorage.setItem('sensorSelected-animations', selectedSensorText);

            //##################################################################
            // BT - Step 1: Load the html file based on the user selection.
            // door_window.html, temperature.
            //##################################################################
            loadSensorContent(selectedSensorText);
            // BT - Step 2: Then connect to broker.
            connectToBroker();

        });
    }

    // BT - Get all the class help-button and then click addEventListener to each buttons.
    document.querySelectorAll('.help-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.getAttribute('data-modal');
            openHelpModal(modalId);
        });
    });


});

//###############################################################################
// BT - This function will load the correct html page in 'Animations.html'
//      based on the menu selector.
//###############################################################################

function loadSensorContent(selectedSensorText) {
    const sensorContentDiv = document.getElementById('sensorContent');

    console.log('BT - loadSensorContent - selection to load web page: ', selectedSensorText);

    // BT - Using pop() to get the last element
    const partAfterDash = selectedSensorText.split('-').pop().trim(); 

    // console.log(partAfterDash); // Output: "door_window"

    let currentURL = `${window.location.origin}/animation_load_page?filter=${partAfterDash}`;

    // Clear existing content
    sensorContentDiv.innerHTML = '';

    // Assuming the files are named after the deveui, e.g., deveui1.html, deveui2.html
    fetch(currentURL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            console.log('BT - Got html from server: ', html);
            sensorContentDiv.innerHTML = html; // Load the HTML content
        })
        .catch(error => {
            console.error('Error loading the sensor content:', error);
        });
}

//##################################################################
// BT - These functions below are for the help question pop up.
//##################################################################

function openHelpModal(modalId) {
    const helpModal = document.getElementById(modalId);
    if (helpModal) {
        helpModal.style.display = 'block';
    }
}

function closeHelpModal(modalId) {
    const helpModal = document.getElementById(modalId);
    if (helpModal) {
        helpModal.style.display = 'none';
    }
}

// Add the existing function to close the modal when clicking outside of it
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
};


//#####################################################################
// BT - Function to fetch data with /messages?filter='event_type'
// event_type: push_button, titl, door_windows...etc.
// Then process these data and run the animation part.
//#####################################################################


//#####################################################################
// BT - Door
//#####################################################################

// Track last processed timestamp
let lastTimestamp = null;

function getDoorWindowAnimation(filter = '') {

    // const filter = localStorage.getItem('sensorSelected-animations');

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

    console.log('BT - in getDoorWindowAnimation - current URL: ', currentURL);

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) return {}; // Handle 404 error
            if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

            // BT - Process each message
            data.messages.forEach(message => {
                // BT - Check to make sure the message has data_decoded['state']
                if (message.data && message.data.data_decoded && message.data.data_decoded.state) {
                    // BT - Read the state.
                    const currentState = message.data.data_decoded.state;
                    // BT - Convert time to milli for easy to comparing.
                    const timestamp = new Date(message.data.current_time).getTime();
                    console.log('BT - last timestamp befor if', lastTimestamp);
                    console.log('BT - timestamp before if: ', timestamp);
                    // BT - Only process if timestamp is new
                    if (timestamp >= lastTimestamp) {
                        // BT - Store the last time stamp. This is for comparing with the new
                        //      message with a newer time stamp.
                        lastTimestamp = timestamp;
                        console.log('BT - last timestamp in if: ', lastTimestamp);
                        console.log("Current State:", currentState);
                        // BT - Toggle the door.
                        toggleDoorState(currentState);
                    } else {
                        console.log("Old data, skipping toggle.");
                    }
                }//if



            });//data.message
        })//data
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}


// Function to update the center text with custom info
function updateDoorText(newText) {
    document.getElementById('door-text').textContent = newText;
}

function toggleDoorState(currentState) {

    updateDoorText(currentState);

}

//#####################################################################
// BT - air_temperature_humidity
//#####################################################################

function updateTemperatureC(temperature) {
    document.getElementById("celsius").textContent = `${temperature}°C`;
}

function updateTemperatureF(celsius) {

    const temperatureF = ((celsius * 1.8) + 32).toFixed(1);
    document.getElementById("fharenheit").textContent = `${temperatureF}°F`;

}

function updateHumidity(humidity) {
    document.getElementById("humidity").textContent = `${humidity}% Humidity`;
}

// Track last processed timestamp
let lastTimestampAir = null;

function getAirTempHumidityAnimation(filter = '') {

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

    console.log('BT - in getAirTempHumidityAnimation - current URL: ', currentURL);

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) return {}; // Handle 404 error
            if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

            // BT - Process each message
            data.messages.forEach(message => {
                // BT - Check to make sure the message has data_decoded['state']
                if (message.data && message.data.data_decoded) {
                    // BT - Read the state.
                    const temperature = message.data.data_decoded.temperature;
                    const humidity = message.data.data_decoded.humidity;
                    // BT - Convert time to milli for easy to comparing.
                    const timestamp = new Date(message.data.current_time).getTime();
                    // BT - Only process if timestamp is new
                    if (timestamp >= lastTimestampAir) {
                        // BT - Store the last time stamp. This is for comparing with the new
                        //      message with a newer time stamp.
                        lastTimestampAir = timestamp;
                        console.log('BT - temperature: ', temperature);
                        console.log("BT - Humidity:", humidity);
                        // BT - Update Temperature
                        updateTemperatureC(temperature);
                        updateTemperatureF(temperature);
                        updateHumidity(humidity);
                    } else {
                        console.log("Old data, skipping toggle.");
                    }
                }//if

            });//data.message
        })//data
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

//#####################################################################
// BT - tilt
//#####################################################################

// Function to adjust the angle of the overlay line based on new data
function updateAngle(degrees) {
    // const angleLine = document.getElementById('angleLine');
    const updateText = document.getElementById('tilt-text');
    // angleLine.style.transform = `rotate(${degrees}deg)`;
    updateText.textContent = `${degrees} °`;
}

// Track last processed timestamp
let lastTimestampTilt = null;

function getTiltAnimation(filter = '') {

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

    console.log('BT - in getAirTempHumidityAnimation - current URL: ', currentURL);

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) return {}; // Handle 404 error
            if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

            // BT - Process each message
            data.messages.forEach(message => {
                // BT - Check to make sure the message has data_decoded['state']
                if (message.data && message.data.data_decoded) {
                    // BT - Read the state.
                    const angle = message.data.data_decoded.tilt_angle;

                    // BT - Convert time to milli for easy to comparing.
                    const timestamp = new Date(message.data.current_time).getTime();
                    // BT - Only process if timestamp is new
                    if (timestamp >= lastTimestampTilt) {
                        // BT - Store the last time stamp. This is for comparing with the new
                        //      message with a newer time stamp.
                        lastTimestampTilt = timestamp;
                        console.log('BT - angle: ', angle);

                        // BT - Update angle
                        updateAngle(angle);

                    } else {
                        console.log("Old data, skipping toggle.");
                    }
                }//if

            });//data.message
        })//data
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

//#####################################################################
// BT - Temperature.
//#####################################################################

function updateTempTemperatureC(temperature) {
    document.getElementById("celsius").textContent = `${temperature}°C`;
}

function updateTempTemperatureF(celsius) {

    const temperatureF = ((celsius * 1.8) + 32).toFixed(1);
    document.getElementById("fharenheit").textContent = `${temperatureF}°F`;

}

// Track last processed timestamp
let lastTimestampTemp = null;

function getTemperatureAnimation(filter = '') {

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

    console.log('BT - in getTemperatureAnimation - current URL: ', currentURL);

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) return {}; // Handle 404 error
            if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

            // BT - Process each message
            data.messages.forEach(message => {
                // BT - Check to make sure the message has data_decoded['state']
                if (message.data && message.data.data_decoded) {
                    // BT - Read the state.
                    const temperature = message.data.data_decoded.temperature;
                    // BT - Convert time to milli for easy to comparing.
                    const timestamp = new Date(message.data.current_time).getTime();
                    // BT - Only process if timestamp is new
                    if (timestamp >= lastTimestampTemp) {
                        // BT - Store the last time stamp. This is for comparing with the new
                        //      message with a newer time stamp.
                        lastTimestampTemp = timestamp;
                        console.log('BT - temperature: ', temperature);
                        // BT - Update Temperature
                        updateTempTemperatureC(temperature);
                        updateTempTemperatureF(temperature);

                    } else {
                        console.log("Old data, skipping toggle.");
                    }
                }//if

            });//data.message
        })//data
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

//#####################################################################
// BT - Wet and Dry.
//#####################################################################

// Function to update the center text with custom info
function updateWetAndDryCenterText(newText) {
    document.getElementById('center-text').textContent = newText;
}

// Track last processed timestamp
let lastTimestampWetDry = null;

function getWetAndDryAnimation(filter = '') {

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

    console.log('BT - in getTemperatureAnimation - current URL: ', currentURL);

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) return {}; // Handle 404 error
            if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

            // BT - Process each message
            data.messages.forEach(message => {
                // BT - Check to make sure the message has data_decoded['state']
                if (message.data && message.data.data_decoded) {
                    // BT - Read the state.
                    const state = message.data.data_decoded.state;
                    // BT - Convert time to milli for easy to comparing.
                    const timestamp = new Date(message.data.current_time).getTime();
                    // BT - Only process if timestamp is new
                    if (timestamp >= lastTimestampWetDry) {
                        // BT - Store the last time stamp. This is for comparing with the new
                        //      message with a newer time stamp.
                        lastTimestampWetDry = timestamp;
                        console.log('BT - state: ', state);
                        // BT - Update state
                        updateWetAndDryCenterText(state);

                    } else {
                        console.log("Old data, skipping toggle.");
                    }
                }//if

            });//data.message
        })//data
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

//#####################################################################
// BT - Push Button.
//#####################################################################

// Function to update the center text with custom info
function updatePushButtonCenterText(newText) {
    document.getElementById('push-button-text').textContent = newText;
}

// Track last processed timestamp
let lastTimestampPush = null;

function getPushButtonAnimation(filter = '') {

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

    console.log('BT - in getPushButtonAnimation - current URL: ', currentURL);

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) return {}; // Handle 404 error
            if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

            // BT - Process each message
            data.messages.forEach(message => {
                // BT - Check to make sure the message has data_decoded['state']
                if (message.data && message.data.data_decoded) {
                    // BT - Read the state.
                    const state = message.data.data_decoded.button_state;
                    // BT - Convert time to milli for easy to comparing.
                    const timestamp = new Date(message.data.current_time).getTime();
                    // BT - Only process if timestamp is new
                    if (timestamp >= lastTimestampWetDry) {
                        // BT - Store the last time stamp. This is for comparing with the new
                        //      message with a newer time stamp.
                        lastTimestampWetDry = timestamp;
                        console.log('BT - state: ', state);
                        // BT - Update state
                        updatePushButtonCenterText(state);

                    } else {
                        console.log("Old data, skipping toggle.");
                    }
                }//if

            });//data.message
        })//data
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}





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
// Utility Functions
//#####################################################################

// Helper function to create a full endpoint URL
function getEndpointURL(filter) {
    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
    return `${window.location.origin}/${endpoint}?filter=${filter}`;
}

// Helper function to handle fetch errors and log messages
//BT - Step 2: fetchData call fetch to do the API call and when the API call is finished.
//             It will call our function == onSuccess. Then onSuccess will call the processMessageData
function fetchData(url, onSuccess) {
    fetch(url)
        .then(response => {
            if (response.status === 404) return {}; // Handle 404 error
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            return response.json();
        })
        .then(onSuccess)
        .catch(error => console.error('Error fetching data:', error));
}

// Process data based on timestamp and state, avoiding duplicate actions
function processMessageData(messages, lastTimestamp, callback) {
    messages.forEach(message => {
        if (message.data && message.data.data_decoded) {
            const timestamp = new Date(message.data.current_time).getTime();
            if (timestamp >= lastTimestamp.value) {
                lastTimestamp.value = timestamp;
                callback(message.data.data_decoded);
            } else {
                console.log("Old data, skipping action.");
            }
        }
    });
}

//#####################################################################
// Door Window Animation
//#####################################################################

let lastTimestampDoor = { value: null };

function getDoorWindowAnimation(filter = '') {
    const url = getEndpointURL(filter);
    console.log('Fetching Door Window data from:', url);

    // BT - Step1: We pass in a function to fetchData.
    fetchData(url, data => {
        processMessageData(data.messages, lastTimestampDoor, decodedData => {
            toggleDoorState(decodedData.state);
        });
    });
}

function toggleDoorState(state) {
    document.getElementById('door-text').textContent = state;
}

//#####################################################################
// Air Temperature and Humidity Animation
//#####################################################################

let lastTimestampAir = { value: null };

function getAirTempHumidityAnimation(filter = '') {
    const url = getEndpointURL(filter);
    console.log('Fetching Air Temp & Humidity data from:', url);

    fetchData(url, data => {
        processMessageData(data.messages, lastTimestampAir, decodedData => {
            updateTemperatureC(decodedData.temperature);
            updateTemperatureF(decodedData.temperature);
            updateHumidity(decodedData.humidity);
        });
    });
}

function updateTemperatureC(temp) {
    document.getElementById("air-temp-humidity-celsius").textContent = `${temp}°C`;
}

function updateTemperatureF(celsius) {
    const fahrenheit = ((celsius * 1.8) + 32).toFixed(1);
    document.getElementById("air-temp-humidity-fharenheit").textContent = `${fahrenheit}°F`;
}

function updateHumidity(humidity) {
    document.getElementById("air-temp-humidity-humidity").textContent = `${humidity}% Humidity`;
}

//#####################################################################
// Tilt Animation
//#####################################################################

let lastTimestampTilt = { value: null };

function getTiltAnimation(filter = '') {
    const url = getEndpointURL(filter);
    console.log('Fetching Tilt data from:', url);

    fetchData(url, data => {
        processMessageData(data.messages, lastTimestampTilt, decodedData => {
            updateAngle(decodedData.tilt_angle);
        });
    });
}

function updateAngle(degrees) {
    document.getElementById('tilt-text').textContent = `${degrees} °`;
}

//#####################################################################
// Temperature Animation
//#####################################################################

let lastTimestampTemp = { value: null };

function getTemperatureAnimation(filter = '') {
    const url = getEndpointURL(filter);
    console.log('Fetching Temperature data from:', url);

    fetchData(url, data => {
        processMessageData(data.messages, lastTimestampTemp, decodedData => {
            updateTempTemperatureC(decodedData.temperature);
            updateTempTemperatureF(decodedData.temperature);
        });
    });
}

function updateTempTemperatureC(temp) {
    document.getElementById("temp-celsius").textContent = `${temp}°C`;
}

function updateTempTemperatureF(celsius) {
    const fahrenheit = ((celsius * 1.8) + 32).toFixed(1);
    document.getElementById("temp-fharenheit").textContent = `${fahrenheit}°F`;
}

//#####################################################################
// Wet and Dry Animation
//#####################################################################

let lastTimestampWetDry = { value: null };

function getWetAndDryAnimation(filter = '') {
    const url = getEndpointURL(filter);
    console.log('Fetching Wet/Dry data from:', url);

    fetchData(url, data => {
        processMessageData(data.messages, lastTimestampWetDry, decodedData => {
            updateWetAndDryCenterText(decodedData.state);
        });
    });
}

function updateWetAndDryCenterText(state) {
    document.getElementById('center-text').textContent = state;
}

//#####################################################################
// Push Button Animation
//#####################################################################

let lastTimestampPush = { value: null };

function getPushButtonAnimation(filter = '') {
    const url = getEndpointURL(filter);
    console.log('Fetching Push Button data from:', url);

    fetchData(url, data => {
        processMessageData(data.messages, lastTimestampPush, decodedData => {
            updatePushButtonCenterText(decodedData.button_state);
        });
    });
}

function updatePushButtonCenterText(state) {
    document.getElementById('push-button-text').textContent = state;
}



// //#####################################################################
// // BT - Function to fetch data with /messages?filter='event_type'
// // event_type: push_button, titl, door_windows...etc.
// // Then process these data and run the animation part.
// //#####################################################################


// //#####################################################################
// // BT - Door
// //#####################################################################

// // Track last processed timestamp
// let lastTimestamp = null;

// function getDoorWindowAnimation(filter = '') {

//     // const filter = localStorage.getItem('sensorSelected-animations');

//     let currentPath = window.location.pathname;
//     let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
//     let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

//     console.log('BT - in getDoorWindowAnimation - current URL: ', currentURL);

//     fetch(currentURL)
//         .then(response => {
//             if (response.status === 404) return {}; // Handle 404 error
//             if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

//             // BT - Process each message
//             data.messages.forEach(message => {
//                 // BT - Check to make sure the message has data_decoded['state']
//                 if (message.data && message.data.data_decoded && message.data.data_decoded.state) {
//                     // BT - Read the state.
//                     const currentState = message.data.data_decoded.state;
//                     // BT - Convert time to milli for easy to comparing.
//                     const timestamp = new Date(message.data.current_time).getTime();
//                     console.log('BT - last timestamp befor if', lastTimestamp);
//                     console.log('BT - timestamp before if: ', timestamp);
//                     // BT - Only process if timestamp is new
//                     if (timestamp >= lastTimestamp) {
//                         // BT - Store the last time stamp. This is for comparing with the new
//                         //      message with a newer time stamp.
//                         lastTimestamp = timestamp;
//                         console.log('BT - last timestamp in if: ', lastTimestamp);
//                         console.log("Current State:", currentState);
//                         // BT - Toggle the door.
//                         toggleDoorState(currentState);
//                     } else {
//                         console.log("Old data, skipping toggle.");
//                     }
//                 }//if



//             });//data.message
//         })//data
//         .catch(error => {
//             console.error('Error fetching data:', error);
//         });
// }


// // Function to update the center text with custom info
// function updateDoorText(newText) {
//     document.getElementById('door-text').textContent = newText;
// }

// function toggleDoorState(currentState) {

//     updateDoorText(currentState);

// }

// //#####################################################################
// // BT - air_temperature_humidity
// //#####################################################################

// function updateTemperatureC(temperature) {
//     document.getElementById("celsius").textContent = `${temperature}°C`;
// }

// function updateTemperatureF(celsius) {

//     const temperatureF = ((celsius * 1.8) + 32).toFixed(1);
//     document.getElementById("fharenheit").textContent = `${temperatureF}°F`;

// }

// function updateHumidity(humidity) {
//     document.getElementById("humidity").textContent = `${humidity}% Humidity`;
// }

// // Track last processed timestamp
// let lastTimestampAir = null;

// function getAirTempHumidityAnimation(filter = '') {

//     let currentPath = window.location.pathname;
//     let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
//     let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

//     console.log('BT - in getAirTempHumidityAnimation - current URL: ', currentURL);

//     fetch(currentURL)
//         .then(response => {
//             if (response.status === 404) return {}; // Handle 404 error
//             if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

//             // BT - Process each message
//             data.messages.forEach(message => {
//                 // BT - Check to make sure the message has data_decoded['state']
//                 if (message.data && message.data.data_decoded) {
//                     // BT - Read the state.
//                     const temperature = message.data.data_decoded.temperature;
//                     const humidity = message.data.data_decoded.humidity;
//                     // BT - Convert time to milli for easy to comparing.
//                     const timestamp = new Date(message.data.current_time).getTime();
//                     // BT - Only process if timestamp is new
//                     if (timestamp >= lastTimestampAir) {
//                         // BT - Store the last time stamp. This is for comparing with the new
//                         //      message with a newer time stamp.
//                         lastTimestampAir = timestamp;
//                         console.log('BT - temperature: ', temperature);
//                         console.log("BT - Humidity:", humidity);
//                         // BT - Update Temperature
//                         updateTemperatureC(temperature);
//                         updateTemperatureF(temperature);
//                         updateHumidity(humidity);
//                     } else {
//                         console.log("Old data, skipping toggle.");
//                     }
//                 }//if

//             });//data.message
//         })//data
//         .catch(error => {
//             console.error('Error fetching data:', error);
//         });
// }

// //#####################################################################
// // BT - tilt
// //#####################################################################

// // Function to adjust the angle of the overlay line based on new data
// function updateAngle(degrees) {
//     // const angleLine = document.getElementById('angleLine');
//     const updateText = document.getElementById('tilt-text');
//     // angleLine.style.transform = `rotate(${degrees}deg)`;
//     updateText.textContent = `${degrees} °`;
// }

// // Track last processed timestamp
// let lastTimestampTilt = null;

// function getTiltAnimation(filter = '') {

//     let currentPath = window.location.pathname;
//     let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
//     let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

//     console.log('BT - in getAirTempHumidityAnimation - current URL: ', currentURL);

//     fetch(currentURL)
//         .then(response => {
//             if (response.status === 404) return {}; // Handle 404 error
//             if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

//             // BT - Process each message
//             data.messages.forEach(message => {
//                 // BT - Check to make sure the message has data_decoded['state']
//                 if (message.data && message.data.data_decoded) {
//                     // BT - Read the state.
//                     const angle = message.data.data_decoded.tilt_angle;

//                     // BT - Convert time to milli for easy to comparing.
//                     const timestamp = new Date(message.data.current_time).getTime();
//                     // BT - Only process if timestamp is new
//                     if (timestamp >= lastTimestampTilt) {
//                         // BT - Store the last time stamp. This is for comparing with the new
//                         //      message with a newer time stamp.
//                         lastTimestampTilt = timestamp;
//                         console.log('BT - angle: ', angle);

//                         // BT - Update angle
//                         updateAngle(angle);

//                     } else {
//                         console.log("Old data, skipping toggle.");
//                     }
//                 }//if

//             });//data.message
//         })//data
//         .catch(error => {
//             console.error('Error fetching data:', error);
//         });
// }

// //#####################################################################
// // BT - Temperature.
// //#####################################################################

// function updateTempTemperatureC(temperature) {
//     document.getElementById("celsius").textContent = `${temperature}°C`;
// }

// function updateTempTemperatureF(celsius) {

//     const temperatureF = ((celsius * 1.8) + 32).toFixed(1);
//     document.getElementById("fharenheit").textContent = `${temperatureF}°F`;

// }

// // Track last processed timestamp
// let lastTimestampTemp = null;

// function getTemperatureAnimation(filter = '') {

//     let currentPath = window.location.pathname;
//     let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
//     let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

//     console.log('BT - in getTemperatureAnimation - current URL: ', currentURL);

//     fetch(currentURL)
//         .then(response => {
//             if (response.status === 404) return {}; // Handle 404 error
//             if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

//             // BT - Process each message
//             data.messages.forEach(message => {
//                 // BT - Check to make sure the message has data_decoded['state']
//                 if (message.data && message.data.data_decoded) {
//                     // BT - Read the state.
//                     const temperature = message.data.data_decoded.temperature;
//                     // BT - Convert time to milli for easy to comparing.
//                     const timestamp = new Date(message.data.current_time).getTime();
//                     // BT - Only process if timestamp is new
//                     if (timestamp >= lastTimestampTemp) {
//                         // BT - Store the last time stamp. This is for comparing with the new
//                         //      message with a newer time stamp.
//                         lastTimestampTemp = timestamp;
//                         console.log('BT - temperature: ', temperature);
//                         // BT - Update Temperature
//                         updateTempTemperatureC(temperature);
//                         updateTempTemperatureF(temperature);

//                     } else {
//                         console.log("Old data, skipping toggle.");
//                     }
//                 }//if

//             });//data.message
//         })//data
//         .catch(error => {
//             console.error('Error fetching data:', error);
//         });
// }

// //#####################################################################
// // BT - Wet and Dry.
// //#####################################################################

// // Function to update the center text with custom info
// function updateWetAndDryCenterText(newText) {
//     document.getElementById('center-text').textContent = newText;
// }

// // Track last processed timestamp
// let lastTimestampWetDry = null;

// function getWetAndDryAnimation(filter = '') {

//     let currentPath = window.location.pathname;
//     let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
//     let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

//     console.log('BT - in getTemperatureAnimation - current URL: ', currentURL);

//     fetch(currentURL)
//         .then(response => {
//             if (response.status === 404) return {}; // Handle 404 error
//             if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

//             // BT - Process each message
//             data.messages.forEach(message => {
//                 // BT - Check to make sure the message has data_decoded['state']
//                 if (message.data && message.data.data_decoded) {
//                     // BT - Read the state.
//                     const state = message.data.data_decoded.state;
//                     // BT - Convert time to milli for easy to comparing.
//                     const timestamp = new Date(message.data.current_time).getTime();
//                     // BT - Only process if timestamp is new
//                     if (timestamp >= lastTimestampWetDry) {
//                         // BT - Store the last time stamp. This is for comparing with the new
//                         //      message with a newer time stamp.
//                         lastTimestampWetDry = timestamp;
//                         console.log('BT - state: ', state);
//                         // BT - Update state
//                         updateWetAndDryCenterText(state);

//                     } else {
//                         console.log("Old data, skipping toggle.");
//                     }
//                 }//if

//             });//data.message
//         })//data
//         .catch(error => {
//             console.error('Error fetching data:', error);
//         });
// }

// //#####################################################################
// // BT - Push Button.
// //#####################################################################

// // Function to update the center text with custom info
// function updatePushButtonCenterText(newText) {
//     document.getElementById('push-button-text').textContent = newText;
// }

// // Track last processed timestamp
// let lastTimestampPush = null;

// function getPushButtonAnimation(filter = '') {

//     let currentPath = window.location.pathname;
//     let endpoint = (currentPath === '/animations') ? 'messages' : 'default';
//     let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

//     console.log('BT - in getPushButtonAnimation - current URL: ', currentURL);

//     fetch(currentURL)
//         .then(response => {
//             if (response.status === 404) return {}; // Handle 404 error
//             if (!response.ok) throw new Error('Network response was not ok, status: ' + response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('BT - in getEventForDataAnimation - Data received from the python server: ', data.messages);

//             // BT - Process each message
//             data.messages.forEach(message => {
//                 // BT - Check to make sure the message has data_decoded['state']
//                 if (message.data && message.data.data_decoded) {
//                     // BT - Read the state.
//                     const state = message.data.data_decoded.button_state;
//                     // BT - Convert time to milli for easy to comparing.
//                     const timestamp = new Date(message.data.current_time).getTime();
//                     // BT - Only process if timestamp is new
//                     if (timestamp >= lastTimestampWetDry) {
//                         // BT - Store the last time stamp. This is for comparing with the new
//                         //      message with a newer time stamp.
//                         lastTimestampWetDry = timestamp;
//                         console.log('BT - state: ', state);
//                         // BT - Update state
//                         updatePushButtonCenterText(state);

//                     } else {
//                         console.log("Old data, skipping toggle.");
//                     }
//                 }//if

//             });//data.message
//         })//data
//         .catch(error => {
//             console.error('Error fetching data:', error);
//         });
// }







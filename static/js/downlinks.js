/**
 * Authors: Benjamin Lindeen, Austin Jacobson, Bryan Tran
 * @file downlinks.js
 * This file is used to handle the downlinks page functionality.
 * It contains the following functions:
 * - connectToBroker(event)
 * - sendDownlink(event)
 * - document.addEventListener('DOMContentLoaded', (event))
 */

// import { json_data } from 'mqtt_messages.js';

let brokerIp = '';


/**
 * Function to fetch the sensors from the server and populate the sensor select dropdown
 * Also, show/hide the configuration based on the selected sensor type
 * Also, show/hide the configuration based on the selected mode
 * @param event - The event object
 * @returns {void}
 */

//###############################################################################################
// BT - When you select a sensor from the sensor dropdown list box, it will call this function.
//###############################################################################################
document.addEventListener('DOMContentLoaded', (event) => {
    const sensorSelectElement = document.getElementById('sensorSelect');
    const modeElement = document.getElementById('mode');
    const thresholdModeConfig = document.getElementById('thresholdModeConfig');
    const reportOnChangeConfig = document.getElementById('reportOnChangeConfig');

    if (sensorSelectElement) {
        sensorSelectElement.addEventListener('change', (event) => {
            const selectedSensorText = sensorSelectElement.options[sensorSelectElement.selectedIndex].textContent;
            console.log("Selected sensor text:", selectedSensorText);
            updateDownlinkTopic();

        });
    }

    if (modeElement) {
        modeElement.addEventListener('change', (event) => {
            const mode = event.target.value;
            thresholdModeConfig.style.display = mode === '0x00' ? 'block' : 'none';
            reportOnChangeConfig.style.display = mode === '0x01' ? 'block' : 'none';
        });
    }

    // BT - Get all the class help-button and then click addEventListener to each buttons.
    document.querySelectorAll('.help-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.getAttribute('data-modal');
            openHelpModal(modalId);
        });
    });

    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    }
});

/**
 * Function to connect to the MQTT broker
 * and subscribe to the given topic
 * Also, store the broker IP for downlink usage
 * @param event - The event object
 * @returns {void}
 */
function connectToBroker(event) {
    // event.preventDefault();

    if (event) {
        event.preventDefault();  // Prevent form submission if the event exists
    }
    const broker = document.getElementById('broker').value;
    const port = document.getElementById('port').value;
    const topic = document.getElementById('topic').value;

    fetch('/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({broker, port, topic})
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showNotification(data.message)
            } else {
                alert('Failed to connect to the broker');
            }
        })
        .catch(error => {
            alert('Error: ' + error);
        });
}

/**
 * Function to send downlink data to the selected sensor
 * Also, construct the downlink data based on the selected sensor type
 * and send it to the server
 * @param event
 * @returns {void}
 */
function sendDownlink(event) {
    event.preventDefault();
    const sensorSelectElement = document.getElementById('sensorSelect');
    // const sensorType = sensorSelectElement ? sensorSelectElement.options[sensorSelectElement.selectedIndex].text.split(' ')[1].toLowerCase() : null;
    const sensorType = sensorSelectElement.options[sensorSelectElement.selectedIndex].text;
    // const devEui = sensorSelectElement ? sensorSelectElement.value.replace(/-/g, '') : ''; // Remove dashes from DevEUI
    const devEui = sensorType.replace(/-/g, '');


    const downlink_topic = document.getElementById('downlink_topic');
    const topic = downlink_topic.value;

    // BT - Remove the dash in deveui.
    const topicWithoutDashes = topic.replace(/-/g, '');

    const hex_topic = document.getElementById('hex_topic');
    const hex = hex_topic.value;

    //##############################################
    // BT - Convert hex to base64 encoded
    //##############################################
    // {'data': base64_encoded_data_here,
    //  'port': 2,
    //  'topic': lora/70741400000deb04/down
    // }
    //###############################################

    
    // BT - Todo: We need to provide an input for entering downlink in hex.
    let downlink_data_base64encoded = hexToBase64(hex);

    const data = downlink_data_base64encoded;

    const port = 2;

    let downlinkData = {topic, data, port};

    console.log("Sending downlink data:", JSON.stringify(downlinkData, null, 2)); // Debug log

    fetch('/send_downlink', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(downlinkData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Response data:', data); // Debug log
            if (data.message) {
                alert('Downlink sent: ' + data.message);
            } else {
                alert('Error sending downlink: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error sending downlink: ' + error);
        });
}

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

function hexToBase64(hexString) {
    // Step 1: Convert hex to bytes
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // Step 2: Convert bytes to Base64
    const base64String = btoa(String.fromCharCode(...bytes));
    
    return base64String;
};

function updateDownlinkTopic() {


    // Get the selected option value
    const selectedSensor = document.getElementById('sensorSelect').value;

    // BT - We need to extract the DevEUI from the selected sensor value.

    const onlyDeveui = selectedSensor.match(/^([a-fA-F0-9]{2}-){7}[a-fA-F0-9]{2}/);

    console.log("In updateDownlinkTopic - Selected sensor:", onlyDeveui[0]);

    // Update the input field with the selected sensor's downlink topic
    const downlinkInput = document.getElementById('downlink_topic');
    downlinkInput.value = `lora/${onlyDeveui[0]}/down`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if there's stored data in localStorage
    const savedBroker = localStorage.getItem('broker');
    const savedPort = localStorage.getItem('port');
    const savedTopic = localStorage.getItem('topic');

    // If saved data exists, populate the form inputs
    if (savedBroker && savedPort && savedTopic) {
        document.getElementById('broker').value = savedBroker;
        document.getElementById('port').value = savedPort;
        document.getElementById('topic').value = savedTopic;

        console.log(`BT - Call connectToBroker()....`);

        // Reconnect to the MQTT server automatically
        connectToBroker();
    }
});

// Function to show notification
function showNotification(message) {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.textContent = message;
    notificationDiv.style.display = 'block';

    // Automatically fade out the notification after 3 seconds
    setTimeout(() => {
        notificationDiv.style.display = 'none';
    }, 3000); // Adjust time as needed
}



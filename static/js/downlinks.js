let brokerIp = '';

document.addEventListener('DOMContentLoaded', (event) => {
    const sensorTypeElement = document.getElementById('sensorType');
    const modeElement = document.getElementById('mode');
    const thresholdModeConfig = document.getElementById('thresholdModeConfig');
    const reportOnChangeConfig = document.getElementById('reportOnChangeConfig');

    if (sensorTypeElement) {
        sensorTypeElement.addEventListener('change', (event) => {
            const sensorType = event.target.value;
            const waterSensorConfig = document.getElementById('waterSensorConfig');
            const tempHumiditySensorConfig = document.getElementById('tempHumiditySensorConfig');

            waterSensorConfig.style.display = sensorType === 'water_sensor' ? 'block' : 'none';
            tempHumiditySensorConfig.style.display = sensorType === 'temp_humidity_sensor' ? 'block' : 'none';

            const waterSensorInputs = waterSensorConfig.querySelectorAll('input, select');
            const tempHumiditySensorInputs = tempHumiditySensorConfig.querySelectorAll('input, select');

            waterSensorInputs.forEach(input => input.required = sensorType === 'water_sensor');
            tempHumiditySensorInputs.forEach(input => input.required = sensorType === 'temp_humidity_sensor');
        });
    }

    if (modeElement) {
        modeElement.addEventListener('change', (event) => {
            const mode = event.target.value;

            thresholdModeConfig.style.display = mode === '0x00' ? 'block' : 'none';
            reportOnChangeConfig.style.display = mode === '0x01' ? 'block' : 'none';
        });
    }

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

function connectToBroker(event) {
    event.preventDefault();
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
                alert(data.message);
                brokerIp = broker; // Store broker IP for downlink usage
            } else {
                alert('Failed to connect to the broker');
            }
        })
        .catch(error => {
            alert('Error: ' + error);
        });
}

function sendDownlink(event) {
    event.preventDefault();
    const topic = document.getElementById('downlinkTopic').value;
    const sensorTypeElement = document.getElementById('sensorType');
    const sensorType = sensorTypeElement ? sensorTypeElement.value : null;
    let downlinkData = { topic, sensor_type: sensorType };

    console.log("Sensor Type:", sensorType); // Debug log

    if (sensorType === 'water_sensor') {
        const enableWaterPresent = document.querySelector('input[name="enable_water_present"]:checked').value;
        const enableWaterNotPresent = document.querySelector('input[name="enable_water_not_present"]:checked').value;
        const threshold = document.getElementById('threshold').value;
        const restoral = document.getElementById('restoral').value;
        downlinkData = {
            ...downlinkData,
            enableWaterPresent,
            enableWaterNotPresent,
            threshold,
            restoral
        };
    } else if (sensorType === 'temp_humidity_sensor') {
        const mode = document.getElementById('mode').value;
        if (mode === '0x00') {
            const reportingInterval = document.getElementById('reportingInterval').value;
            const restoralMargin = document.getElementById('restoralMargin').value;
            const lowerTempThreshold = document.getElementById('lowerTempThreshold').value;
            const upperTempThreshold = document.getElementById('upperTempThreshold').value;
            const lowerHumidityThreshold = document.getElementById('lowerHumidityThreshold').value;
            const upperHumidityThreshold = document.getElementById('upperHumidityThreshold').value;
            downlinkData = {
                ...downlinkData,
                mode,
                reportingInterval,
                restoralMargin,
                lowerTempThreshold,
                upperTempThreshold,
                lowerHumidityThreshold,
                upperHumidityThreshold
            };
        } else if (mode === '0x01') {
            const tempIncrease = document.getElementById('tempIncrease').value;
            const tempDecrease = document.getElementById('tempDecrease').value;
            const humidityIncrease = document.getElementById('humidityIncrease').value;
            const humidityDecrease = document.getElementById('humidityDecrease').value;
            downlinkData = {
                ...downlinkData,
                mode,
                tempIncrease,
                tempDecrease,
                humidityIncrease,
                humidityDecrease
            };
        }
    }

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
}

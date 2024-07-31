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
                startFetchingMessages();
            } else {
                alert('Failed to connect to the broker');
            }
        })
        .catch(error => {
            alert('Error: ' + error);
        });
}

function fetchMessages(filter = '') {
    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/mqtt_messages') ? 'messages' : (currentPath === '/upload_messages') ? 'upload' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;

    fetch(currentURL)
        .then(response => response.json())
        .then(data => {
            const messageTable = document.getElementById('messageTableBody');
            messageTable.innerHTML = '';
            data.messages.reverse();
            data.messages.forEach((message, index) => {
                const row = document.createElement('tr');
                const timeCell = document.createElement('td');
                const devEUICell = document.createElement('td');
                const topicCell = document.createElement('td');
                const messageTypeCell = document.createElement('td');
                const messageData1Cell = document.createElement('td');
                const messageData2Cell = document.createElement('td');
                const messageData3Cell = document.createElement('td');
                const buttonCell = document.createElement('td');
                const moreInfoButton = document.createElement('button');

                const time = message.data.time;
                const date = new Date(time);
                const options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                };

                timeCell.textContent = date.toLocaleDateString('en-US', options);
                devEUICell.textContent = message.data.deveui;
                topicCell.textContent = message.topic.substring(message.topic.lastIndexOf('/') + 1);

                if (message.type === 'json') {
                    if ('data_decoded' in message.data) {
                        if ('message_type' in message.data.data_decoded) {
                            messageTypeCell.textContent = message.data.data_decoded.message_type;
                            data = message.data.data_decoded;
                        }
                        switch (data.message_type) {
                            case 'Water Leak Sensor':
                                messageData1Cell.innerHTML = `<em>Water Status:</em> <strong>${data.water_status}</strong><br>`;
                                messageData2Cell.innerHTML = `<em>Measurement (0-255):</em> <strong>${data['Measurement (0-255)']}</strong><br>`;
                                break;
                            case 'Door/Window Sensor Event':
                                messageData1Cell.innerHTML = `<em>Status:</em> <strong>${data.open_close_status}</strong><br>`;
                                break;
                            case 'Push Button Sensor':
                                messageData1Cell.innerHTML = `<em>Button ID:</em> <strong>${data.button_id}</strong><br>`;
                                messageData2Cell.innerHTML = `<em>Action Performed:</em> <strong>${data.action_performed}</strong><br>`;
                                break;
                            case 'Dry Contact Sensor':
                                messageData1Cell.innerHTML = `<em>Connection Status:</em> <strong>${data.connection_status}</strong><br>`;
                                break;
                            case 'Thermistor Temperature Sensor':
                                messageData1Cell.innerHTML = `<em>Event Type:</em> <strong>${data.event_type}</strong><br>`;
                                messageData2Cell.innerHTML = `<em>Temperature:</em> <strong>${data.current_temperature}</strong><br>`;
                                break;
                            case 'Tilt Sensor':
                                messageData1Cell.innerHTML = `<em>Event Type:</em> <strong>${data.event_type}</strong><br>`;
                                messageData2Cell.innerHTML = `<em>Angle of Tilt:</em> <strong>${data.angle_of_tilt}</strong><br>`;
                                break;
                            case 'Temperature and Humidity Sensor':
                                const eventTypeDescription = eventTypeMap[data.data.reporting_event_type] || `Unknown (${data.data.reporting_event_type})`;
                                messageData1Cell.innerHTML = `<em>Event Type:</em> <strong>${eventTypeDescription}</strong><br>`;
                                messageData2Cell.innerHTML = `<em>Temperature:</em> <strong>${data.data.temperature_fahrenheit.toFixed(2)} °F</strong><br>`;
                                messageData3Cell.innerHTML = `<em>Humidity:</em> <strong>${data.data.humidity}%</strong><br>`;
                                break;
                            case 'Supervisory Message':
                                messageData1Cell.innerHTML = message.data.data_decoded.battery_voltage.toFixed(1) + 'V';
                                messageData2Cell.innerHTML = `<em>Error Code:</em> <strong>${data.device_error_code}</strong><br>`;
                                messageData3Cell.innerHTML = `<em>Sensor State:</em> <strong>${data.current_sensor_state}<strong><br>`;
                                break;
                        }
                    }
                    moreInfoButton.textContent = 'More Info';
                    moreInfoButton.onclick = () => showModal(message.data);
                    buttonCell.appendChild(moreInfoButton);
                }

                row.appendChild(timeCell);
                row.appendChild(devEUICell);
                row.appendChild(topicCell);
                row.appendChild(messageTypeCell);
                row.appendChild(messageData1Cell);
                row.appendChild(messageData2Cell);
                row.appendChild(messageData3Cell);
                row.appendChild(buttonCell);
                messageTable.appendChild(row);
            });
        });
}

const eventTypeMap = {
    0x00: "Periodic Report",
    0x01: "Temperature has risen above upper threshold",
    0x02: "Temperature has fallen below lower threshold",
    0x03: "Temperature report-on-change increase",
    0x04: "Temperature report-on-change decrease",
    0x05: "Humidity has risen above upper threshold",
    0x06: "Humidity has fallen below lower threshold",
    0x07: "Humidity report-on-change increase",
    0x08: "Humidity report-on-change decrease"
};

function showModal(data) {
    const modal = document.getElementById('myModal');
    const modalContent = document.getElementById('modalText');
    modalContent.textContent = JSON.stringify(data, null, 2);
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

function startFetchingMessages() {
    setInterval(() => fetchMessages(document.getElementById('filter').value), 5000);
}

document.querySelector('.close').addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    const modal = document.getElementById('myModal');
    if (event.target === modal) {
        closeModal();
    }
});

function dumpMessagesToJSON() {
    window.location.href = '/dump_messages';
}

document.getElementById('dumpMessages').addEventListener('click', dumpMessagesToJSON);

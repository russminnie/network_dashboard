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
                const batteryVoltageCell = document.createElement('td');
                const messageCell = document.createElement('td');
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
                        }
                        if ('battery_voltage' in message.data.data_decoded) {
                            batteryVoltageCell.textContent = message.data.data_decoded.battery_voltage.toFixed(1) + 'V';
                        }
                        messageCell.innerHTML = formatContent(message.data.data_decoded);
                    }
                    moreInfoButton.textContent = 'More Info';
                    moreInfoButton.onclick = () => showModal(message.data);
                    buttonCell.appendChild(moreInfoButton);
                }

                row.appendChild(timeCell);
                row.appendChild(devEUICell);
                row.appendChild(topicCell);
                row.appendChild(messageTypeCell);
                row.appendChild(messageCell);
                row.appendChild(batteryVoltageCell);
                row.appendChild(buttonCell);
                messageTable.appendChild(row);
            });
        });
}

function formatContent(data) {
    let content = ``;

    switch (data.message_type) {
        case 'Water Leak Sensor Event':
            content += `<em>Water Status:</em> <strong>${data.water_status}</strong><br>`;
            content += `<em>Measurement (0-255):</em> <strong>${data['Measurement (0-255)']}</strong><br>`;
            break;
        case 'Door/Window Sensor Event':
            content += `<em>Status:</em> <strong>${data.open_close_status}</strong><br>`;
            break;
        case 'Push Button Sensor Event':
            content += `<em>Button ID:</em> <strong>${data.button_id}</strong><br>`;
            content += `<em>Action Performed:</em> <strong>${data.action_performed}</strong><br>`;
            break;
        case 'Dry Contact Sensor Event':
            content += `<em>Connection Status:</em> <strong>${data.connection_status}</strong><br>`;
            break;
        case 'Thermistor Temperature Sensor Event':
            content += `<em>Event Type:</em> <strong>${data.event_type}</strong><br>`;
            content += `<em>Temperature:</em> <strong>${data.current_temperature}</strong><br>`;
            break;
        case 'Tilt Sensor Event':
            content += `<em>Event Type:</em> <strong>${data.event_type}</strong><br>`;
            content += `<em>Angle of Tilt:</em> <strong>${data.angle_of_tilt}</strong><br>`;
            break;
        case 'Air Temperature Sensor Event':
            content += `<em>Event Type:</em> <strong>${data.event_type}</strong><br>`;
            content += `<em>Temperature:</em> <strong>${data.temperature}</strong><br>`;
            content += `<em>Humidity:</em> <strong>${data.humidity}</strong><br>`;
            break;
        case 'Supervisory Message':
            content += `<em>Error Code:</em> <strong>${data.device_error_code}</strong><br>`;
            content += `<em>Sensor State:</em> <strong>${data.current_sensor_state}<strong><br>`;
            break;
    }

    return content;
}

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

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
            } else {
                alert('Failed to connect to the broker');
            }
        })
        .catch(error => {
            alert('Error: ' + error);
        });
}

function fetchMessages(filter = '') {
    fetch(`/messages?filter=${filter}`)
        .then(response => response.json())
        .then(data => {
            const messageTable = document.getElementById('messageTableBody');
            messageTable.innerHTML = '';
            data.messages.forEach((message, index) => {
                const row = document.createElement('tr');
                const topicCell = document.createElement('td');
                const contentCell = document.createElement('td');
                const buttonCell = document.createElement('td');
                const moreInfoButton = document.createElement('button');

                topicCell.textContent = message.topic;

                if (message.type === 'json') {
                    if ('data_decoded' in message.data) {
                        contentCell.innerHTML = formatContent(message.data.data_decoded);
                    } else {
                        contentCell.textContent = 'No decoded data';
                    }
                    moreInfoButton.textContent = 'More Info';
                    moreInfoButton.onclick = () => showModal(index);
                    buttonCell.appendChild(moreInfoButton);
                } else {
                    contentCell.textContent = message.data;
                }

                row.appendChild(topicCell);
                row.appendChild(contentCell);
                row.appendChild(buttonCell);
                messageTable.appendChild(row);

                // Store the full message data in a data attribute for later use
                row.dataset.fullMessage = JSON.stringify(message.data, null, 2);
            });
        });
}

function formatContent(data) {
    let content = `<strong>Message Type:</strong> ${data.message_type}<br>`;

    switch (data.message_type) {
        case 'Water Leak Sensor Event':
            content += `<strong>Measurement (0-255):</strong> ${data['Measurement (0-255)']}<br>`;
            content += `<strong>Water Status:</strong> ${data.water_status}<br>`;
            break;
        case 'Door/Window Sensor Event':
            content += `<strong>Open/Close Status:</strong> ${data.open_close_status}<br>`;
            break;
        case 'Push Button Sensor Event':
            content += `<strong>Button ID:</strong> ${data.button_id}<br>`;
            content += `<strong>Action Performed:</strong> ${data.action_performed}<br>`;
            break;
        case 'Dry Contact Sensor Event':
            content += `<strong>Connection Status:</strong> ${data.connection_status}<br>`;
            break;
        case 'Thermistor Temperature Sensor Event':
            content += `<strong>Event Type:</strong> ${data.event_type}<br>`;
            content += `<strong>Current Temperature:</strong> ${data.current_temperature}<br>`;
            break;
        case 'Tilt Sensor Event':
            content += `<strong>Event Type:</strong> ${data.event_type}<br>`;
            content += `<strong>Angle of Tilt:</strong> ${data.angle_of_tilt}<br>`;
            break;
        case 'Air Temperature Sensor Event':
            content += `<strong>Event Type:</strong> ${data.event_type}<br>`;
            content += `<strong>Temperature:</strong> ${data.temperature}<br>`;
            content += `<strong>Humidity:</strong> ${data.humidity}<br>`;
            break;
        case 'Supervisory Message':
            content += `<strong>Device Error Code:</strong> ${data.device_error_code}<br>`;
            content += `<strong>Current Sensor State:</strong> ${data.current_sensor_state}<br>`;
            content += `<strong>Battery Level:</strong> ${data.battery_level}<br>`;
            content += `<strong>Battery Voltage:</strong> ${data.battery_voltage.toFixed(1)}V<br>`;
            break;
        default:
            content += 'No specific data available for this message type.';
    }

    return content;
}

function showModal(index) {
    const modal = document.getElementById('myModal');
    const modalContent = document.getElementById('modal-content');
    const messageRow = document.getElementById('messageTableBody').children[index];
    modalContent.textContent = messageRow.dataset.fullMessage;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

function dumpMessagesToJSON() {
    fetch('/dump_messages', {
        method: 'GET'
    })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'message_buffer.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Error downloading the file:', error));
}

// Add event listener to the button
document.getElementById('dumpMessages').addEventListener('click', dumpMessagesToJSON);

setInterval(() => fetchMessages(document.getElementById('filter').value), 5000); // Fetch messages every 5 seconds
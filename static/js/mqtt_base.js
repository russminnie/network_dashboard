function fetchMessages(filter = '') {
    fetch(`/messages?filter=${filter}`)
        .then(response => response.json())
        .then(data => {
            const messageTable = document.getElementById('messageTableBody');
            messageTable.innerHTML = '';
            data.messages.forEach(message => {
                const row = document.createElement('tr');
                const topicCell = document.createElement('td');
                const typeCell = document.createElement('td');
                const contentCell = document.createElement('td');

                topicCell.textContent = message.topic;
                typeCell.textContent = message.type;

                if (message.type === 'json') {
                    const contentTable = document.createElement('table');
                    for (const [key, value] of Object.entries(message.data)) {
                        const contentRow = document.createElement('tr');
                        const keyCell = document.createElement('td');
                        const valueCell = document.createElement('td');

                        keyCell.textContent = key;
                        keyCell.title = message.tooltips[key] || 'No description available';

                        if (key === 'data_decoded' && typeof value === 'object') {
                            const decodedList = document.createElement('ul');
                            for (const [k, v] of Object.entries(value)) {
                                const listItem = document.createElement('li');
                                listItem.textContent = `${k}: ${v}`;
                                decodedList.appendChild(listItem);
                            }
                            valueCell.appendChild(decodedList);
                        } else {
                            valueCell.textContent = value;
                        }

                        contentRow.appendChild(keyCell);
                        contentRow.appendChild(valueCell);
                        contentTable.appendChild(contentRow);
                    }
                    contentCell.appendChild(contentTable);
                } else {
                    contentCell.textContent = message.data;
                }

                row.appendChild(topicCell);
                row.appendChild(typeCell);
                row.appendChild(contentCell);
                messageTable.appendChild(row);
            });
        });
}

setInterval(() => fetchMessages(document.getElementById('filter').value), 5000); // Fetch messages every 5 seconds

function openDownlinkForm() {
    document.getElementById('downlinkForm').style.display = 'block';
}

function sendDownlink() {
    const topic = document.getElementById('downlinkTopic').value;
    const waterPresent = document.querySelector('input[name="water_present"]:checked').value;
    const waterNotPresent = document.querySelector('input[name="water_not_present"]:checked').value;
    const threshold = document.getElementById('threshold').value;
    const restoral = document.getElementById('restoral').value;

    const payload = `${parseInt(waterPresent, 2)}${parseInt(waterNotPresent, 2)}${parseInt(threshold).toString(16).padStart(2, '0')}${parseInt(restoral).toString(16).padStart(2, '0')}`;

    fetch('/send_downlink', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({topic, payload})
    })
        .then(response => response.json())
        .then(data => {
            alert('Downlink sent: ' + data.message);
        })
        .catch(error => {
            alert('Error sending downlink: ' + error);
        });

    document.getElementById('downlinkForm').style.display = 'none';
}
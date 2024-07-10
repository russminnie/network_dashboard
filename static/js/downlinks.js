let brokerIp = '';

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
    const enableWaterPresent = document.querySelector('input[name="enable_water_present"]:checked').value;
    const enableWaterNotPresent = document.querySelector('input[name="enable_water_not_present"]:checked').value;
    const threshold = document.getElementById('threshold').value;
    const restoral = document.getElementById('restoral').value;

    console.log("Sending downlink data:", {topic, enableWaterPresent, enableWaterNotPresent, threshold, restoral}); // Debug log

    fetch('/send_downlink', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            topic,
            enableWaterPresent,
            enableWaterNotPresent,
            threshold,
            restoral
        })
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

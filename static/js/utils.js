
function connectToBroker(event) {

    if (event) {
        // Prevent form submission if the event exists
        event.preventDefault();  
    }


    // Check if there's stored data in localStorage
    let broker = localStorage.getItem('broker');
    let port = localStorage.getItem('port');
    let topic = localStorage.getItem('topic');

    if (!broker && !port && !topic){

        //BT - Get user configuration
        broker = document.getElementById('broker').value;
        port = document.getElementById('port').value;
        topic = document.getElementById('topic').value;

        // Save the input data to localStorage
        localStorage.setItem('broker', broker);
        localStorage.setItem('port', port);
        localStorage.setItem('topic', topic);


    }

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
                //BT - Show connected message.
                showNotification(data.message)
                // BT - Start fetching the messages from the server.
                startFetchingMessages();

            } else {
                // alert('Failed to connect to the broker');
                showNotification('Failed to connect to the broker');
            }
        })
        .catch(error => {
            alert('Error: ' + error);
        });
}


// Function to start fetching messages every 5 seconds
function startFetchingMessages() {

    const connectForm = document.getElementById('connectForm');
    const filterElement = document.getElementById('filter');
    const sensorSelectChartsElement = document.getElementById('sensorSelect-charts');
    const sensorSelectAnimationsElement = document.getElementById('sensorSelect-animations')

    if(connectForm && filterElement){
        setInterval(() => fetchMessages(filterElement.value), 5000);
    }
    // BT - Select charts page.
    else if (sensorSelectChartsElement){
        setInterval(() => getData(localStorage.getItem('sensorSelected-charts')), 5000);
    }
    // BT - Select 'Animation' page
    else if (sensorSelectAnimationsElement){
        //#################################################################################
        // BT - This is where we must call door_window, temperature, tilt...etc.
        //#################################################################################
        const sensorLocalStorage = localStorage.getItem('sensorSelected-animations');
        // BT - Using pop() to get the last element
        const partAfterDash = sensorLocalStorage.split('-').pop().trim();
        console.log('BT - sensorSelected-animations: ', partAfterDash);
        if (partAfterDash === 'door_window'){
            setInterval(() => getDoorWindowAnimation(partAfterDash), 5000);
        }
        else if (partAfterDash === 'air_temperature_humidity'){
            setInterval(() => getAirTempHumidityAnimation(partAfterDash), 5000);
        }
        else if (partAfterDash === 'tilt'){
            setInterval(() => getTiltAnimation(partAfterDash), 5000);
        }
        else if (partAfterDash === 'temperature'){
            setInterval(() => getTemperatureAnimation(partAfterDash), 5000);
        }
        else if (partAfterDash === 'water'){
            setInterval(() => getWetAndDryAnimation(partAfterDash), 5000);
        }
        else if (partAfterDash === 'push_button'){
            setInterval(() => getPushButtonAnimation(partAfterDash), 5000);
        }  
    }
    
}



// BT - Function to show notification
function showNotification(message) {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.textContent = message;
    notificationDiv.style.display = 'block';

    // Automatically fade out the notification after 3 seconds
    setTimeout(() => {
        notificationDiv.style.display = 'none';
    }, 5000); // Adjust time as needed
}
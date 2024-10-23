
function connectToBroker(event) {

    if (event) {
        // Prevent form submission if the event exists
        event.preventDefault();  
    }


    // Check if there's stored data in localStorage
    const broker = localStorage.getItem('broker');
    const port = localStorage.getItem('port');
    const topic = localStorage.getItem('topic');

    if (!broker && port && topic){

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

    if(connectForm && filterElement){
        setInterval(() => fetchMessages(filterElement.value), 5000);
    }
    else{
        setInterval(() => getData(localStorage.getItem('sensorSelected')), 5000);
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
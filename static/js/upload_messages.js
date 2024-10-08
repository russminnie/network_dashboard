
function updateFileName() {

    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.getElementById('fileName');
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
    } else {
        fileNameDisplay.textContent = '';
    }
}

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

// showNotification('Disconnected from MQTT server')

// BT - Call to fetch messages to display on our table.
fetchMessages();

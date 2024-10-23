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
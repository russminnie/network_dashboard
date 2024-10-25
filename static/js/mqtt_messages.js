/**
 * Authors: Benjamin Lindeen, Austin Jacobson, Bryan Tran
 * @file mqtt_messages.js
 * This file contains the JavaScript code for the MQTT messages page.
 * It contains the following functions:
 * - connectToBroker(event)
 * - fetchMessages(filter = '')
 * - showModal(data)
 * - closeModal()
 * - startFetchingMessages()
 * - dumpMessagesToJSON()
 * - document.querySelector('.close').addEventListener('click', closeModal)
 */


/**
 * Function to fetch messages from the server
 * and display them in the table
 * @param filter - The filter to apply to the messages
 * @returns {void}
 */
function fetchMessages(filter = '') {

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/') ? 'messages' : (currentPath === '/upload_messages') ? 'upload' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;
 
    /**
     * Fetch the messages from the server
     * creates a table row for each message
     * and appends it to the table
     * @param currentURL - The URL to fetch the messages from
     */
    fetch(currentURL)
        .then(response => {

            // BT - Handle if there is an 404
            if (response.status === 404) {
                // Handle the 404 error specifically
                return {}; // Or return an empty object, depending on your needs
            }
            // Check for other potential errors (e.g., 500, 403, etc.)
            if (!response.ok) {
                throw new Error('Network response was not ok, status: ' + response.status);
            }
            // console.log(`BT - Fetching data from Python server at: ${currentURL}`)
            return response.json(); // Only parse if the response is okay

        })
        .then(data => {
            const messageTable = document.getElementById('messageTableBody');
            messageTable.innerHTML = '';
            data.messages.reverse();

            // console.log(`BT - Receiving data from the server: ${JSON.stringify(data.messages)}`);

            data.messages.forEach((message, index) => {
                const row = document.createElement('tr');
                const timeCell = document.createElement('td');
                const devEUICell = document.createElement('td');
                const topicCell = document.createElement('td');
                const messageTypeCell = document.createElement('td');
                const messageDataCell = document.createElement('td');
                // const messageData2Cell = document.createElement('td');
                // const messageData3Cell = document.createElement('td');
                const buttonCell = document.createElement('td');
                const moreInfoButton = document.createElement('button');
                buttonCell.style.textAlign = 'center';  // Center the button inside the cell


                // const time = message.data.current_time;
                // const date = new Date(time);
                // const options = {
                //     year: 'numeric',
                //     month: 'long',
                //     day: 'numeric',
                //     hour: '2-digit',
                //     minute: '2-digit',
                //     second: '2-digit',
                //     timeZoneName: 'short'
                // };

                // timeCell.textContent = date.toLocaleDateString('en-US', options);
                timeCell.textContent = message.data.current_time;
                timeCell.style.textAlign = 'center'; // Center the text in the topicCell

                if (!(message.data.deveui)){
                    const parsedValue = message.topic.split('/')[1];
                    devEUICell.textContent = parsedValue;
                }
                else{
                    devEUICell.textContent = message.data.deveui;
                }
                
                devEUICell.style.textAlign = 'center'; // Center the text in the topicCell
                topicCell.textContent = message.topic.substring(message.topic.lastIndexOf('/') + 1);
                topicCell.style.textAlign = 'center'; // Center the text in the topicCell

                /**
                 * Check if the message type is 'json'
                 * checks for which type of sensor the JSON has data for
                 * and displays the data in the table
                 * @param message - The message object
                 */
                if (message.type === 'json') {
                    if ('data_decoded' in message.data) {
                        if ('event' in message.data.data_decoded) {
                            messageTypeCell.textContent = message.data.data_decoded.event;
                            messageTypeCell.style.textAlign = 'center'; // Center the text in the topicCell
                            messageDataCell.textContent = JSON.stringify(message.data.data_decoded, null, 1);
                        }
                    }
                    else if (topicCell.textContent === 'down_queued'){
                        messageTypeCell.textContent = `Received response id: ${message.data.id}`;
                        messageTypeCell.style.textAlign = 'center'; // Center the text in the topicCell
                        messageDataCell.textContent = JSON.stringify(message.data.data_decoded, null, 1);                        
                    }

                }//(message.type === 'json')
                
                    /**
                     * Create a button to show the full JSON data
                     * and a button to ask GPT for a response
                     * @param message - The message object
                     */
                    moreInfoButton.textContent = 'Full Json';
                    moreInfoButton.onclick = () => showModal(message.data);
                    buttonCell.appendChild(moreInfoButton);

                    row.appendChild(timeCell);
                    row.appendChild(devEUICell);
                    row.appendChild(topicCell);
                    row.appendChild(messageTypeCell);
                    row.appendChild(messageDataCell);
                    // row.appendChild(messageData2Cell);
                    // row.appendChild(messageData3Cell);
                    row.appendChild(buttonCell);
                    messageTable.appendChild(row);
            });
        }) 
        .catch(error => {
            return {}
        })
}

/**
 * Function to show the modal with the given data
 * @param data - The data to show in the modal
 * @returns {void}
 */
function showModal(data) {
    const modal = document.getElementById('myModal');
    const modalContent = document.getElementById('modalText');
    modalContent.textContent = JSON.stringify(data, null, 2);
    modal.style.display = 'block';
}

/**
 * Function to close the modal
 * @returns {void}
 */
function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}


/**
 * Close the modal when the user clicks outside of it
 * @returns {void}
 */
window.addEventListener('click', (event) => {
    const modal = document.getElementById('myModal');
    if (event.target === modal) {
        closeModal();
    }
});

/**
 * Dump messages to JSON
 * @returns {void}
 */
function dumpMessagesToJSON() {
    window.location.href = '/dump_messages';
}

//#############################################################
// BT - Magic starts here.
//#############################################################
document.addEventListener('DOMContentLoaded', function() {


    // Check if there's stored data in localStorage
    // const savedBroker = localStorage.getItem('broker');
    // const savedPort = localStorage.getItem('port');
    // const savedTopic = localStorage.getItem('topic');

    // const connectForm = document.getElementById('connectForm');
    // const sensorSelected = document.getElementById('sensorSelected');

    // if (connectForm){

    //     // If saved data exists, populate the form inputs
    //     if (savedBroker && savedPort && savedTopic) {
    //         document.getElementById('broker').value = savedBroker;
    //         document.getElementById('port').value = savedPort;
    //         document.getElementById('topic').value = savedTopic;

    //         // Reconnect to the MQTT server automatically
    //         connectToBroker();
    //     } 

    // }

    connectToBroker();

    // Close the modal when the user clicks the close button
    const closeButton = document.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    } else {
        console.error('Close button not found.');
    }


    /**
     * Dump messages to JSON when the button is clicked
     */

    if (document.getElementById('dumpMessages')) {
        document.getElementById('dumpMessages').addEventListener('click', dumpMessagesToJSON);
    }


});


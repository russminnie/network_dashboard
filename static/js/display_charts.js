// BT - When page load, we want to get the selectedSensor.

document.addEventListener('DOMContentLoaded', () => {

    // BT - Check to see if there is a sensorSelect id.
    const sensorSelectElement = document.getElementById('#sensorSelect');

    // BT - Add an event 'onchange' to it. So that we can get the value.
    if (sensorSelectElement) {
        sensorSelectElement.addEventListener('change', (event) => {
            const selectedSensorText = sensorSelectElement.options[sensorSelectElement.selectedIndex].textContent;
            console.log("Selected sensor text:", selectedSensorText);
            // BT - Pass the value change to some functions.
            getData(selectedSensorText);

        });
    }

});

//#############################################################
// BT - Get the data based on the deveui.
//#############################################################
function getData(filter = '') {

    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/charts') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;
    console.log(`BT - currentURL in getData: ${currentURL}`);
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
        });
}
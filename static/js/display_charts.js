
// function connectToBroker(event) {

//     if (event) {
//         // Prevent form submission if the event exists
//         event.preventDefault();  
//     }


//     // Check if there's stored data in localStorage
//     const broker = localStorage.getItem('broker');
//     const port = localStorage.getItem('port');
//     const topic = localStorage.getItem('topic');

//     if (!broker && port && topic){

//         //BT - Get user configuration
//         broker = document.getElementById('broker').value;
//         port = document.getElementById('port').value;
//         topic = document.getElementById('topic').value;

//         // Save the input data to localStorage
//         localStorage.setItem('broker', broker);
//         localStorage.setItem('port', port);
//         localStorage.setItem('topic', topic);


//     }

//     fetch('/connect', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({broker, port, topic})
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.message) {
//                 //BT - Show connected message.
//                 showNotification(data.message)
//                 // BT - Start fetching the messages from the server.
//                 startFetchingMessages();

//             } else {
//                 // alert('Failed to connect to the broker');
//                 showNotification('Failed to connect to the broker');
//             }
//         })
//         .catch(error => {
//             alert('Error: ' + error);
//         });
// }

// Global variables to hold the chart instance and data
let chart;  // Will hold the Chart.js instance
let times = []; // Global times array
let rssiValues = []; // Global rssiValues array

// // Function to start fetching messages every 5 seconds
// function startFetchingMessages() {
//     setInterval(() => getData(localStorage.getItem('sensorSelected')), 5000);
// }

// When the page loads, connect to the broker and set up the chart
document.addEventListener('DOMContentLoaded', () => {
    connectToBroker();

    // Check for the sensorSelect element
    const sensorSelectElement = document.getElementById('sensorSelect');

    if (sensorSelectElement) {
        sensorSelectElement.addEventListener('change', (event) => {
            const selectedSensorText = sensorSelectElement.options[sensorSelectElement.selectedIndex].textContent;
            console.log("Selected sensor text:", selectedSensorText);
            localStorage.setItem('sensorSelected', selectedSensorText);
            // Fetch initial data for the selected sensor
            getData(selectedSensorText);
        });
    }

    // Initialize the chart when the page loads
    initChart();
});

// Function to initialize the chart
function initChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');

    // Create the initial chart instance
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times, // Initial empty labels
            datasets: [{
                label: 'RSSI vs Time',
                data: rssiValues, // Initial empty data
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill color
                borderColor: 'rgba(75, 192, 192, 1)',       // Border color
                borderWidth: 1,
                fill: false // No area under the line
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Timestamp' // X-axis title
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'RSSI' // Y-axis title
                    }
                }
            }
        }
    });
}

// Function to fetch data
function getData(filter = '') {
    let currentPath = window.location.pathname;
    let endpoint = (currentPath === '/charts') ? 'messages' : 'default';
    let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;
    console.log(`BT - currentURL: ${currentURL}`);

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) {
                return {}; // Handle 404 error
            }
            if (!response.ok) {
                throw new Error('Network response was not ok, status: ' + response.status);
            }
            console.log(`BT - Fetching data from Python server at: ${currentURL}`);
            return response.json();
        })
        .then(data => {
            data.messages.reverse(); // Reverse data for chronological order
            console.log(`BT - Receiving data from the server: ${JSON.stringify(data.messages)}`);

            // Clear old data arrays
            times = [];
            rssiValues = [];

            data.messages.forEach((message) => {
                console.log('BT - Process each message: ', message);
                const currentTime = message.data.current_time;
                const rssi = message.data.rssi;

                if (currentTime && rssi !== undefined) {
                    times.push(currentTime); // Push time for X-axis
                    rssiValues.push(rssi);   // Push RSSI for Y-axis
                }
            });

            updateChart(times, rssiValues); // Update the chart with new data
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Function to update the chart with new data
function updateChart(newTimes, newRssiValues) {
    chart.data.labels = newTimes; // Update X-axis labels
    chart.data.datasets[0].data = newRssiValues; // Update Y-axis data
    chart.update(); // Refresh the chart with the new data
}


// /**
//  * Function to start fetching messages every 5 seconds
//  * @returns {void}
//  */
// function startFetchingMessages() {
   

//     setInterval(() => getData(localStorage.getItem('sensorSelected')), 5000);

// }




// // BT - When page load, we want to get the selectedSensor.

// document.addEventListener('DOMContentLoaded', () => {

//     connectToBroker();

//     // BT - Check to see if there is a sensorSelect id.
//     const sensorSelectElement = document.getElementById('sensorSelect');

//     // BT - Add an event 'onchange' to it. So that we can get the value.
//     if (sensorSelectElement) {
//         sensorSelectElement.addEventListener('change', (event) => {
//             const selectedSensorText = sensorSelectElement.options[sensorSelectElement.selectedIndex].textContent;
//             console.log("Selected sensor text:", selectedSensorText);
//             localStorage.setItem('sensorSelected', selectedSensorText)
//             // BT - Pass the value change to some functions.
//             getData(selectedSensorText);

//         });
//     }

// });

// function getData(filter = '') {

//     let currentPath = window.location.pathname;
//     let endpoint = (currentPath === '/charts') ? 'messages' : 'default';
//     let currentURL = `${window.location.origin}/${endpoint}?filter=${filter}`;
//     console.log(`BT - currentURL: ${currentURL}`);
//     /**
//      * Fetch the messages from the server
//      * creates a table row for each message
//      * and appends it to the table
//      * @param currentURL - The URL to fetch the messages from
//      */
//     fetch(currentURL)
//         .then(response => {

//             // BT - Handle if there is an 404
//             if (response.status === 404) {
//                 // Handle the 404 error specifically
//                 return {}; // Or return an empty object, depending on your needs
//             }
//             // Check for other potential errors (e.g., 500, 403, etc.)
//             if (!response.ok) {
//                 throw new Error('Network response was not ok, status: ' + response.status);
//             }
//             console.log(`BT - Fetching data from Python server at: ${currentURL}`)
//             return response.json(); // Only parse if the response is okay

//         })
//         .then(data => {

//             data.messages.reverse();

//             console.log(`BT - Receiving data from the server: ${JSON.stringify(data.messages)}`);

//             // Initialize arrays for the X-axis (times) and Y-axis (rssi)
//             let times = [];
//             let rssiValues = [];

//             // Assume data.messages is available
//             data.messages.forEach((message) => {
//                 console.log('BT - Process each message: ', message);

//                 const currentTime = message.data.current_time;
//                 const rssi = message.data.rssi;

//                 if (currentTime && rssi !== undefined) {
//                     // Collect data for the chart
//                     times.push(currentTime); // Push the time for the X-axis
//                     rssiValues.push(rssi);   // Push the rssi for the Y-axis
//                 }
//             });

//             drawChart(times,rssiValues);
//         }) 
//         .catch(error => {
//             return {}
//         })
// }


// // Function to draw the chart using Chart.js
// function drawChart(times, deveuis) {
    
//     // Set up the chart
//     const ctx = document.getElementById('sensorChart').getContext('2d');

//     console.log('BT - times: ', times);
//     console.log('BT - rssiValue: ', rssiValues);

//     new Chart(ctx, {
//         type: 'line', // Change this to 'bar' if you want a bar chart
//         data: {
//             labels: times, // The X-axis data (timestamps)
//             datasets: [{
//                 label: 'RSSI vs Time',
//                 data: rssiValues, // The Y-axis data (RSSI values)
//                 backgroundColor: 'rgba(75, 192, 192, 0.2)', // Bar fill color
//                 borderColor: 'rgba(75, 192, 192, 1)',       // Border color
//                 borderWidth: 1,
//                 fill: false // No area under the line
//             }]
//         },
//         options: {
//             scales: {
//                 x: {
//                     title: {
//                         display: true,
//                         text: 'Timestamp' // Add title for the x-axis
//                     }
//                 },
//                 y: {
//                     title: {
//                         display: true,
//                         text: 'RSSI' // Add title for the y-axis
//                     }
//                 }
//             }
//         }
//     });

// }
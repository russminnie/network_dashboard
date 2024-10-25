
// Global variables to hold the chart instance and data
let chart;  // Will hold the Chart.js instance
let times = []; // Global times array
let rssiValues = []; // Global rssiValues array
let lsnrValues = []; // Global rssiValues array


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

    // BT - Get all the class help-button and then click addEventListener to each buttons.
    document.querySelectorAll('.help-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.getAttribute('data-modal');
            openHelpModal(modalId);
        });
    });

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
            },{
                label: 'LSNR vs Time',
                data: lsnrValues, // Initial empty data
                backgroundColor: 'rgba(255, 165, 0, 0.2)', // Fill color
                borderColor: 'rgba(255, 165, 0, 1)',       // Border color
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
                },
                y1: {  // Secondary Y-axis (for SNR)
                        type: 'linear',
                        position: 'right',
                        title: {
                        display: true,
                        text: 'LSNR (dB)'
                    },
                    grid: {
                        drawOnChartArea: false,  // Prevent grid lines from overlapping
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

    fetch(currentURL)
        .then(response => {
            if (response.status === 404) {
                return {}; // Handle 404 error
            }
            if (!response.ok) {
                throw new Error('Network response was not ok, status: ' + response.status);
            }

            return response.json();
        })
        .then(data => {
            // data.messages.reverse(); // Reverse data for chronological order
            // Clear old data arrays
            times = [];
            rssiValues = [];
            lsnrValues = []; 

            data.messages.forEach((message) => {
                console.log('BT - Process each message: ', message);
                const currentTime = message.data.current_time;
                const rssi = message.data.rssi;
                const lsnr = message.data.lsnr;

                if (currentTime && rssi && lsnr !== undefined) {
                    times.push(currentTime); // Push time for X-axis
                    rssiValues.push(rssi);   // Push RSSI for Y-axis
                    lsnrValues.push(lsnr);
                }
            });

            updateChart(times, rssiValues,lsnrValues); // Update the chart with new data
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Function to update the chart with new data
function updateChart(newTimes, newRssiValues, newLsnr) {
    chart.data.labels = newTimes; // Update X-axis labels
    chart.data.datasets[0].data = newRssiValues; // Update Y-axis data
    chart.data.datasets[1].data = newLsnr;
    chart.update(); // Refresh the chart with the new data
}

function openHelpModal(modalId) {
    const helpModal = document.getElementById(modalId);
    if (helpModal) {
        helpModal.style.display = 'block';
    }
}

function closeHelpModal(modalId) {
    const helpModal = document.getElementById(modalId);
    if (helpModal) {
        helpModal.style.display = 'none';
    }
}

// Add the existing function to close the modal when clicking outside of it
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
};

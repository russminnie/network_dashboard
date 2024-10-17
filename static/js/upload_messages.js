
function updateFileName() {

    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.getElementById('fileName');
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
    } else {
        fileNameDisplay.textContent = '';
    }
}

// BT - Call to fetch messages to display on our table.
fetchMessages();

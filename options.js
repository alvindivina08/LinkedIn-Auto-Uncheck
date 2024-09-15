// options.js

// Save options to chrome.storage
function saveOptions(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;

    chrome.storage.sync.set({
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber
    }, function() {
        alert('Options saved.');
    });
}

// Restore options from chrome.storage
function restoreOptions() {
    chrome.storage.sync.get(['firstName', 'lastName', 'phoneNumber'], function(items) {
        document.getElementById('firstName').value = items.firstName || '';
        document.getElementById('lastName').value = items.lastName || '';
        document.getElementById('phoneNumber').value = items.phoneNumber || '';
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);
    
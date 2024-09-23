// options.js

// Save options to chrome.storage
function saveOptions(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const city = document.getElementById('city').value;


    // Get the question-answer pairs
    const qaItems = document.querySelectorAll('.qa-item');
    const qaPairs = [];

    qaItems.forEach(item => {
        const question = item.querySelector('.question').value;
        const answer = item.querySelector('.answer').value;
        if (question && answer) {
            qaPairs.push({ question, answer });
        }
    });

    chrome.storage.sync.set({
        firstName,
        lastName,
        phoneNumber,
        city,
        qaPairs
    }, function() {
        alert('Options saved.');
    });
}

// Restore options from chrome.storage
function restoreOptions() {
    chrome.storage.sync.get(['firstName', 'lastName', 'phoneNumber','city', 'qaPairs'], function(items) {
        document.getElementById('firstName').value = items.firstName || '';
        document.getElementById('lastName').value = items.lastName || '';
        document.getElementById('phoneNumber').value = items.phoneNumber || '';
        document.getElementById('city').value = items.city || '';

        // Restore question-answer pairs
        const qaPairs = items.qaPairs || [];
        qaPairs.forEach(addQaItem);
    });
}

function addQaItem(pair = {}) {
    const qaList = document.getElementById('qa-list');
    const div = document.createElement('div');
    div.className = 'qa-item';

    const questionInput = document.createElement('input');
    questionInput.type = 'text';
    questionInput.placeholder = 'Question';
    questionInput.className = 'question';
    questionInput.value = pair.question || '';

    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.placeholder = 'Answer';
    answerInput.className = 'answer';
    answerInput.value = pair.answer || '';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        qaList.removeChild(div);
    });

    div.appendChild(questionInput);
    div.appendChild(answerInput);
    div.appendChild(deleteButton);
    qaList.appendChild(div);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);
document.getElementById('add-qa-button').addEventListener('click', () => addQaItem());

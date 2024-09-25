(function() {
    let userInteracted = new Set();
    let seenQuestions = new Set(); 
    let filledQuestions = new Set(); 

    function uncheckFollowCompany() {
        const followCheckbox = document.querySelector('input[type="checkbox"][id="follow-company-checkbox"]');
        
        if (followCheckbox && followCheckbox.checked && !userInteracted.has(followCheckbox.id)) {
            followCheckbox.checked = false;
        }
    }

    function getQuestionElements() {
        return document.querySelectorAll('span, label, a');
    }

    function startMonitoring() {
        const observer = new MutationObserver(() => {
            const form = document.querySelector('#jobs-apply-header');
            if (form) {
                uncheckFollowCompany(); 
                fillPersonalInfo();
                fillCustomAnswers();
                const submitButton = document.querySelector('button[aria-label="Submit application"]');
                if (submitButton) {
                    observer.disconnect(); // Stop observing mutations
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        uncheckFollowCompany();
    }

    function extractQuestions() {
        const questionElements =  getQuestionElements();
        const questions = new Set();
    
        questionElements.forEach(element => {
            const text = element.textContent.trim();
            if (text.length > 0 && text.includes(`?`) || 
                text.length > 0 && text.includes(`Do you`) || 
                text.length > 0 && text.includes(`Race and ethnicity`) || 
                text.length > 0 && text.includes(`Gender`) || 
                text.includes(`Status`)) {
                questions.add(text);
            }
        });
    
        return questions;
    }


    function fillPersonalInfo() {
        chrome.storage.sync.get(['firstName', 'lastName', 'phoneNumber', 'city'], function(items) {
            const firstName = items.firstName || '';
            const lastName = items.lastName || '';
            const phoneNumber = items.phoneNumber || '';
            const city = items.city || '';

            // Fill first name
            const firstNameInput = document.querySelector("input[name='firstName'], input[id*='firstName']");
            if (firstNameInput && !userInteracted.has(firstNameInput.id)) {
                firstNameInput.value = firstName;
                firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Fill last name
            const lastNameInput = document.querySelector("input[name='lastName'], input[id*='lastName']");
            if (lastNameInput && !userInteracted.has(lastNameInput.id)) {
                lastNameInput.value = lastName;
                lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Fill phone number
            const phoneInput = document.querySelector("input[id*='phoneNumber'], input[name*='phoneNumber']");
            if (phoneInput && !userInteracted.has(phoneInput.id)) {
                phoneInput.value = phoneNumber;
                phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            const cityInput = document.querySelector("input[id*='city'], input[name*='city']");
            if (cityInput && !userInteracted.has(city.id)) {
                console.log(city)
                cityInput.value = city;
                cityInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }
    
    function fillCustomAnswers() {
        chrome.storage.sync.get('qaPairs', function(items) {
            const qaPairs = items.qaPairs || [];
            if (Array.isArray(qaPairs)) {
                const allQuestions = extractQuestions();
                // Filter qaPairs and only include unseen questions
                const filteredQaPairs = qaPairs.filter(pair => 
                    allQuestions.has(pair.question) && !seenQuestions.has(pair.question)
                );

                if (filteredQaPairs.length > 0) {
                    fillAnswer(filteredQaPairs, () => {
                        // Mark the filtered pairs as seen after processing
                        filteredQaPairs.forEach(pair => seenQuestions.add(pair.question));
                    });
                }
            } else {
                console.error('qaPairs is not an array');
            }
        });
    }

    function fillAnswer(qaPairs) {
        // Find all elements that might contain questions and answers
        const allElements =  getQuestionElements();
        const userInteracted = new Set(); // Ensure you have this defined as you're checking it
        qaPairs.forEach(({question, answer}) => {
            if (!filledQuestions.has(question)) {
                filledQuestions.add(question)
                console.log(question)
                let found = false;
                for (const element of allElements) {
                    const elementText = element.textContent.trim();
    
                    if (elementText.includes(question)) {
                        // Find the nearest container that includes both the question and answers
                        const formContainer = element.closest('form, div'); // Adjust as necessary
                        if (formContainer) {
                            // Combine finding inputs and labels to reduce loops
                            const inputsAndLabels = formContainer.querySelectorAll('label, input, select');
    
                            for (const item of inputsAndLabels) {
                                // Check for matching labels for radio/checkbox
                                if (item.tagName.toLowerCase() === 'label' && item.textContent.trim() === answer) {
                                    const inputId = item.getAttribute('for');
                                    const input = document.getElementById(inputId);
                                    if (input && (input.type === 'radio' || input.type === 'checkbox') && !userInteracted.has(inputId)) {
                                        input.checked = true;
                                        input.dispatchEvent(new Event('change', { bubbles: true }));
                                        userInteracted.add(inputId);
                                        found = true;
                                        break;
                                    }
                                }
    
                                // Check for text inputs
                                if (item.tagName.toLowerCase() === 'input' && item.type === 'text') {
                                    const label = formContainer.querySelector(`label[for="${item.id}"]`);
                                    if (label && label.textContent.trim().includes(question) && !userInteracted.has(item.id)) {
                                        item.value = answer;
                                        item.dispatchEvent(new Event('input', { bubbles: true }));
                                        userInteracted.add(item.id);
                                        found = true;
                                        break;
                                    }
                                }
    
                                // Check for select dropdowns
                                if (item.tagName.toLowerCase() === 'select') {
                                    const label = formContainer.querySelector(`label[for="${CSS.escape(item.id)}"]`);
                                    if (label && label.textContent.trim().includes(question) && !userInteracted.has(item.id)) {
                                        for (const option of item.options) {
                                            if (option.textContent.trim() === answer) {
                                                item.value = option.value;
                                                item.dispatchEvent(new Event('change', { bubbles: true }));
                                                userInteracted.add(item.id);
                                                found = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
    
                            if (found) break; // Stop processing once a match is found
                        }
                    }
                }
            }
        });
    }

    function addManualInputListener() {
        const allInputs = document.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                userInteracted.add(input.id); // Mark this input as manually edited
            });
            input.addEventListener('change', () => {
                userInteracted.add(input.id); // Also listen for changes on select elements
            });
        });
    }

    let lastUrl = location.href;
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            startMonitoring(); 
        }
    }).observe(document, { subtree: true, childList: true });

    startMonitoring(); 
    addManualInputListener()
})();

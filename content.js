(function() {
    console.log('LinkedIn AutoFill script loaded');

    let userInteracted = new Set(); // Store IDs of inputs where users manually entered data

    function uncheckFollowCompany() {
        const followCheckbox = document.querySelector('input[type="checkbox"][id="follow-company-checkbox"]');
        
        if (followCheckbox && followCheckbox.checked && !userInteracted.has(followCheckbox.id)) {
            followCheckbox.checked = false;
            console.log('Checkbox unchecked');
        }
    }

    function startMonitoring() {
        console.log('Starting to monitor for changes...');
        const observer = new MutationObserver(() => {
            uncheckFollowCompany(); 
            fillPersonalInfo();
            fillCustomAnswers();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        uncheckFollowCompany();
    }

    function fillPersonalInfo() {
        chrome.storage.sync.get(['firstName', 'lastName', 'phoneNumber'], function(items) {
            const firstName = items.firstName || '';
            const lastName = items.lastName || '';
            const phoneNumber = items.phoneNumber || '';

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
        });
    }

    function fillCustomAnswers() {
        chrome.storage.sync.get('qaPairs', function(items) {
            const qaPairs = items.qaPairs || [];
            qaPairs.forEach(pair => {
                fillAnswer(pair.question, pair.answer);
            });
        });
    }

    function fillAnswer(questionText, answerText) {
        // Find all elements that might contain the question text
        const allElements = document.querySelectorAll('label, div, span, p');
        let found = false;
    
        outerLoop:
        for (const element of allElements) {
            if (element.textContent.trim().includes(questionText)) {
                // Find the nearest container that includes both the question and answers
                const formContainer = element.closest('form, div'); // Adjust as necessary
                if (formContainer) {
                    // Find all labels and inputs within this container
                    const labels = formContainer.querySelectorAll('label');
                    for (const label of labels) {
                        const labelText = label.textContent.trim();
                        // Check for radio and checkbox inputs
                        if (labelText === answerText) {
                            const inputId = label.getAttribute('for');
                            if (inputId) {
                                const input = document.getElementById(inputId);
                                if (input && (input.type === 'radio' || input.type === 'checkbox') && !userInteracted.has(inputId)) {
                                    input.checked = true;
                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                    found = true;
                                    console.log(`Selected "${answerText}" for question "${questionText}"`);
                                    break outerLoop; // Exit both loops after finding the match
                                }
                            }
                        }
                    }
                    
                    // Check for text input fields
                    const textInputs = formContainer.querySelectorAll('input[type="text"]');
                    for (const input of textInputs) {
                        const label = formContainer.querySelector(`label[for="${input.id}"]`);
                        if (label && label.textContent.trim().includes(questionText) && !userInteracted.has(input.id)) {
                            input.value = answerText;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            found = true;
                            console.log(`Filled text input with "${answerText}" for question "${questionText}"`);
                            break outerLoop;
                        }
                    }

                    // Check for select dropdowns
                    const selectInputs = formContainer.querySelectorAll('select');
                    for (const select of selectInputs) {
                        // Attempt to find the label associated with the select element
                        const escapedId = CSS.escape(select.id);
                        let label = formContainer.querySelector(`label[for="${escapedId}"]`);
                        console.log(`label = ${label}`);
    
                        if (!label) {
                            // If no label with 'for' attribute, check if the current element is the label
                            if (element.contains(select) || select.contains(element) || element.nextElementSibling === select || element === select.previousElementSibling) {
                                label = element;
                            } else {
                                // Check preceding sibling elements
                                let prevElement = select.previousElementSibling;
                                while (prevElement) {
                                    if (prevElement.textContent.trim().includes(questionText)) {
                                        label = prevElement;
                                        break;
                                    }
                                    prevElement = prevElement.previousElementSibling;
                                }
                            }
                        }
    
                        if (label && label.textContent.trim().includes(questionText) && !userInteracted.has(select.id || select.name)) {
                            for (const option of select.options) {
                                if (option.textContent.trim() === answerText) {
                                    select.value = option.value;
                                    select.dispatchEvent(new Event('change', { bubbles: true }));
                                    found = true;
                                    console.log(`Selected "${answerText}" for question "${questionText}" from dropdown`);
                                    break outerLoop;
                                }
                            }
                        }
                    }
                }
            }
        }
    
        if (!found) {
            console.log(`Could not find question "${questionText}" or answer "${answerText}"`);
        }
    }

    // Add event listeners to detect user interaction and prevent further autofill on those inputs
    function addManualInputListener() {
        const allInputs = document.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                userInteracted.add(input.id); // Mark this input as manually edited
                console.log(`User manually filled input: ${input.id}`);
            });
            input.addEventListener('change', () => {
                userInteracted.add(input.id); // Also listen for changes on select elements
                console.log(`User manually changed select: ${input.id}`);
            });
        });
    }

    let lastUrl = location.href;
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log('URL changed, re-checking...');
            startMonitoring(); 
        }
    }).observe(document, { subtree: true, childList: true });

    startMonitoring();
    addManualInputListener(); // Start listening for manual inputs
})();

(function() {
    console.log('LinkedIn Auto Uncheck script loaded');

    function uncheckFollowCompany() {
        const followCheckbox = document.querySelector('input[type="checkbox"][id="follow-company-checkbox"]');
        
        if (followCheckbox) {
            console.log('Checkbox found');
            if (followCheckbox.checked) {
                followCheckbox.checked = false;
                console.log('Checkbox unchecked');
            }
        }
        fillPhoneNumber();
        fillName();
    }

    function startMonitoring() {
        console.log('Starting to monitor for checkbox...');
        const observer = new MutationObserver(() => {
            uncheckFollowCompany(); 
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        uncheckFollowCompany();
    }

    function fillPhoneNumber() {
        chrome.storage.sync.get('phoneNumber', function(items) {
            const phoneNumber = items.phoneNumber || '';
            const phoneInput = document.querySelector("input[id*='phoneNumber-nationalNumber']");
            console.log('phone');
            
            if (phoneInput) {
                phoneInput.value = phoneNumber;
                const event = new Event('input', { bubbles: true });
                phoneInput.dispatchEvent(event);
            }
        });
    }

    function fillName() {
        chrome.storage.sync.get(['firstName', 'lastName'], function(items) {
            const firstName = items.firstName || '';
            const lastName = items.lastName || '';

            const firstNameInput = document.querySelector("input[name='firstName']");
            const lastNameInput = document.querySelector("input[name='lastName']");

            if (firstNameInput) {
                firstNameInput.value = firstName;
                const event = new Event('input', { bubbles: true });
                firstNameInput.dispatchEvent(event);
            }

            if (lastNameInput) {
                lastNameInput.value = lastName;
                const event = new Event('input', { bubbles: true });
                lastNameInput.dispatchEvent(event);
            }
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

})();

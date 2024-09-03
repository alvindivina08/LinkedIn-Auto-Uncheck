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

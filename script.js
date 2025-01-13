async function handleInput() {
    const userInput = document.getElementById('userPrompt').value;

    if (!userInput) {
        alert('Please enter your healthcare needs to get started.');
        return;
    }

    try {
        const response = await fetch('https://quickhealthplan-com.onrender.com/api/get-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: userInput }),
        });

        if (response.ok) {
            const data = await response.json();
            displayRecommendations(data.response); // Use the response data
        } else {
            alert('Error fetching recommendations. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to the server.');
    }
}

function displayRecommendations(recommendations) {
    const modal = document.getElementById('resultModal');
    const loading = document.getElementById('loading');
    const responseContent = document.getElementById('responseContent');
    const statusMessage = document.getElementById('statusMessage');
    const aiResponse = document.getElementById('aiResponse');
    const progress = document.querySelector('.loading-bar .progress');

    // Show the modal
    modal.style.display = 'flex';

    // Simulate loading steps
    const messages = [
        'Checking top providers...',
        'Applying deals...',
        'Calculating savings...',
        'Finalizing recommendations...'
    ];
    let step = 0;

    const interval = setInterval(() => {
        if (step < messages.length) {
            statusMessage.textContent = messages[step];
            step++;
        }
    }, 3000);

    // Animate progress bar
    progress.style.width = '100%';

    // After 15 seconds, show the response
    setTimeout(() => {
        clearInterval(interval);
        loading.style.display = 'none';
        responseContent.style.display = 'block';
        aiResponse.innerHTML = recommendations;
    }, 15000);
}

// Close modal when clicking outside of it
window.onclick = function (event) {
    const modal = document.getElementById('resultModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};


function formatRecommendations(recommendations) {
    // This assumes the recommendations content is plain text. Split into paragraphs or sections if needed.
    const formatted = recommendations
        .split('\n')
        .map(line => `<p style="margin: 0.5em 0;">${line.trim()}</p>`)
        .join('');
    return `<div>${formatted}</div>`;
}

function handleFollowUp() {
    alert('Feel free to ask more questions or provide additional details about your needs!');
}



function calculateInsuranceSavings(userDetails) {
    const { ageGroup, location, children, smoker } = userDetails;

    // Base premiums for each age group
    const basePremiums = {
        '20s': 538.74,
        '30s': 754.24,
        '40s': 1077.48,
        '50s': 1508.47,
        '60s': 1831.71,
    };

    // Get base premium for age group
    const basePremium = basePremiums[ageGroup];
    let freedomPremium = basePremium;
    let competitorPremium = basePremium;

    // Adjust for London premium (23% increase)
    if (location === 'London') {
        freedomPremium *= 1; // No increase for Freedom
        competitorPremium *= 1.23; // Increase for competitors
    }

    // Add child coverage
    const childCost = children * 543.84; // Freedom doesn't charge for additional children
    competitorPremium += childCost;

    // Adjust for smoker status (random increase between 11% and 40%)
    if (smoker) {
        const smokerIncrease = Math.random() * (40 - 11) + 11; // Random percentage
        freedomPremium *= 1 + smokerIncrease / 100;
        competitorPremium *= 1 + smokerIncrease / 100;
    }

    // Calculate savings
    const monthlyFreedomCost = (freedomPremium / 12).toFixed(2);
    const annualSavings = (competitorPremium - freedomPremium).toFixed(2);
    const monthlySavings = (annualSavings / 12).toFixed(2);

    return {
        monthlyFreedomCost,
        annualSavings,
        monthlySavings,
    };
}


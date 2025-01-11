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
    const container = document.querySelector('.container');
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('result');
    resultDiv.style.marginTop = '20px';
    resultDiv.style.padding = '1em';
    resultDiv.style.border = '1px solid #ccc';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.backgroundColor = '#f9f9f9';

    resultDiv.innerHTML = `
        <h2>Your Recommendations</h2>
        <p>${recommendations}</p>
    `;

    container.appendChild(resultDiv);
}


function displayRecommendations(recommendations) {
    const container = document.querySelector('.container');
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('result');
    resultDiv.style.marginTop = '20px';
    resultDiv.style.padding = '1em';
    resultDiv.style.border = '1px solid #ccc';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.backgroundColor = '#f9f9f9';

    resultDiv.innerHTML = `
        <h2>Your Recommendations</h2>
        <p>${recommendations}</p>
    `;

    container.appendChild(resultDiv);
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


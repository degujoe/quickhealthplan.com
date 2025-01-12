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
    resultDiv.style.padding = '1.5em';
    resultDiv.style.border = '1px solid #0073e6';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.backgroundColor = '#eef7ff';
    resultDiv.style.color = '#333';
    resultDiv.style.lineHeight = '1.8';
    resultDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

    resultDiv.innerHTML = `
        <h2 style="color: #0073e6; text-align: center; margin-bottom: 1em;">Your Personalized Recommendations</h2>
        <div style="padding: 1em; background-color: #ffffff; border-radius: 8px;">
            ${formatRecommendations(recommendations)}
        </div>
        <div style="margin-top: 1em; text-align: center;">
            <button style="
                padding: 0.8em 1.5em;
                background-color: #0073e6;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 1em;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s ease;
            " 
            onclick="handleFollowUp()">Ask More Questions</button>
        </div>
    `;

    container.appendChild(resultDiv);
}

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


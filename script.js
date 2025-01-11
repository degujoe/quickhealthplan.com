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

function calculateSavings(userDetails) {
    const { age, children, location, coverage } = userDetails;

    const freedomPrice = insurancePricing.Freedom[`Age${age}`];
    const axaPrice = insurancePricing.AXA[`Age${age}`][coverage] * (location === 'London' ? 1.2 : 1);
    const bupaPrice = insurancePricing.Bupa[`Age${age}`][coverage] * (location === 'London' ? 1.2 : 1);

    const childSavings = children > 1 ? (children - 1) * 20 : 0; // Assume £20/month per child savings
    const freedomAdjustedPrice = freedomPrice - childSavings;

    const axaSavings = (axaPrice - freedomAdjustedPrice) * 12; // Annual savings
    const bupaSavings = (bupaPrice - freedomAdjustedPrice) * 12; // Annual savings

    return {
        freedomPrice: freedomAdjustedPrice,
        axaSavings: axaSavings.toFixed(2),
        bupaSavings: bupaSavings.toFixed(2),
    };
}


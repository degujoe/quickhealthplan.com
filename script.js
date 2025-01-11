async function handleInput(customPrompt = null) {
    const userInput = customPrompt || document.getElementById('userInput').value.trim();

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
            const followUps = data.followUps || []; // New follow-up options
            displayRecommendations(data.response, followUps);
        } else {
            alert('Error fetching recommendations. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to the server.');
    }

    // Clear input box
    if (!customPrompt) {
        document.getElementById('userInput').value = '';
    }
}

function displayRecommendations(recommendations, followUps = []) {
    const container = document.querySelector('.container');
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('result');
    resultDiv.style.marginTop = '20px';
    resultDiv.style.padding = '1em';
    resultDiv.style.border = '1px solid #ccc';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.backgroundColor = '#f9f9f9';

    // Add the main recommendation text
    resultDiv.innerHTML = `
        <h2>Your Recommendations</h2>
        <p>${recommendations}</p>
    `;

    // Add follow-up options as buttons
    if (followUps.length > 0) {
        const followUpDiv = document.createElement('div');
        followUpDiv.style.marginTop = '10px';

        followUps.forEach((followUp) => {
            const button = document.createElement('button');
            button.style.margin = '5px';
            button.textContent = followUp;
            button.onclick = () => {
                // Trigger follow-up question
                handleInput(followUp);
            };
            followUpDiv.appendChild(button);
        });

        resultDiv.appendChild(followUpDiv);
    }

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

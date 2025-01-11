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




const chatHistory = document.getElementById('chatHistory');

let conversationHistory = [];

async function sendMessage() {
    const userInput = document.getElementById('userInput').value.trim();

    if (!userInput) {
        alert('Please type a message.');
        return;
    }

    // Append user message to chat
    appendMessage('user', userInput);

    // Add user input to conversation history
    conversationHistory.push({ role: 'user', content: userInput });

    try {
        const response = await fetch('https://quickhealthplan-com.onrender.com/api/get-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: userInput, history: conversationHistory }),
        });

        if (response.ok) {
            const data = await response.json();
            appendMessage('ai', data.response);

            // Update conversation history
            conversationHistory = data.history;
        } else {
            appendMessage('ai', 'Sorry, I could not process your request. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        appendMessage('ai', 'Failed to connect to the server.');
    }

    // Clear input box
    document.getElementById('userInput').value = '';
}


function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender);

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.innerText = text;

    messageDiv.appendChild(messageContent);
    chatHistory.appendChild(messageDiv);

    // Scroll to the bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}



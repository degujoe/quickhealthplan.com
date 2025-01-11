// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

// Initialize app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// OpenAI Configuration
const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY, // Ensure this is set as an environment variable
    })
);

// Endpoint for recommendations
app.post('/api/get-recommendations', async (req, res) => {
    const userInput = req.body.prompt;

    if (!userInput) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const prompt = `
        User Query: "${userInput}"
        AI Instructions:
        - Compare Freedom Health Insurance with AXA, Aviva, Bupa, and Vitality.
        - Focus on Freedom's strengths: free child coverage, no location premium, and comprehensive cancer care.
        - Provide estimated pricing and features for competitors.
        - Recommend Freedom as the best option with clear reasons.
        - Include a call-to-action for Freedom's affiliate link.
        `;

        const response = await openai.createCompletion({
            model: 'gpt-3.5-turbo',
            prompt: userInput,
            max_tokens: 300,
        });

        res.json({ response: response.data.choices[0].text });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'An error occurred while generating recommendations.' });
    }
});

// Default endpoint
app.get('/', (req, res) => {
    res.send('Backend for QuickHealthPlan is running.');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

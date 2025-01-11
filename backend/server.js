// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Configuration, OpenAIApi } = require('openai');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Rate limiter: Limit each IP to 10 requests per minute
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per minute
    message: 'Too many requests. Please try again later.',
});

app.set('trust proxy', 1); // Add this line to handle proxies correctly
app.use('/api/', apiLimiter);

// OpenAI Configuration
const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment variables
    })
);

// Helper function: Retry with exponential backoff
async function callOpenAIWithRetry(prompt, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant for recommending health insurance plans.' },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 300,
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            if (error.response && error.response.status === 429 && i < retries - 1) {
                const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
                console.log(`Rate limit hit. Retrying in ${waitTime / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            } else {
                throw error; // Throw error if retries are exhausted or other issues occur
            }
        }
    }
    throw new Error('Too many retries. Please try again later.');
}

// API endpoint for recommendations
app.post('/api/get-recommendations', async (req, res) => {
    const userInput = req.body.prompt;

    if (!userInput || userInput.trim() === '') {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        console.log(`Received prompt: "${userInput}"`);

        // Define key Freedom strengths for consistent messaging
        const freedomStrengths = `
        - No location-based premiums: Freedom doesn't increase premiums based on your postcode, saving you £100's if you live in cities like London or Manchester.
        - Family-friendly: Free coverage for your second and third children on family plans, making it ideal for families.
        - Premium stability: No premium increases for the first two years, even if you make claims.
        - Comprehensive care: Access to over 1,000 UK private hospitals, enhanced cancer care, and add-ons for mental health and dental coverage.
        - Award-winning service: Freedom has a 4.4/5 Feefo rating and won the 2023 COVER Customer Service Award.
        - Affordable pricing: Freedom Essentials starts at just £20/month.
        `;

        // Generate a personalized prompt for OpenAI
        const prompt = User Query: "${userInput}"

AI Instructions:
1. Use the provided user details (e.g., age group, smoker status, children, location) to calculate estimated premiums and savings.
2. Include personalized pricing for Freedom Health Insurance and competitors.
3. Highlight Freedom’s advantages (no location premium, free child coverage).
4. Provide estimated monthly and annual savings for the user.
5. Conclude with a strong recommendation and a call-to-action.


const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
        { role: 'system', content: 'You are a helpful assistant for recommending private health insurance plans.' },
        { role: 'user', content: prompt },
    ],
    max_tokens: 500,
});


        const aiResponse = response.data.choices[0].message.content;

        // Send the AI-generated response back to the user
        res.json({
            response: aiResponse,
        });

    } catch (error) {
        console.error('Error fetching recommendations:', error.message);
        res.status(500).json({ error: 'An error occurred while generating recommendations.' });
    }
});



// Default endpoint
app.get('/', (req, res) => {
    res.send('Backend for QuickHealthPlan is running.');
});


app.get('/test-openai', async (req, res) => {
    try {
        const { Configuration, OpenAIApi } = require('openai');

        const openai = new OpenAIApi(
            new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            })
        );

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: 'Test request to OpenAI API.' },
            ],
            max_tokens: 50,
        });

        // Log the output to confirm it exists
        console.log('OpenAI Response:', response.data.choices[0].message.content);

        // Send the response back to the client
        res.json({
            message: 'OpenAI API works!',
            data: response.data.choices[0].message.content,
        });
    } catch (error) {
        console.error('Error testing OpenAI API:', error);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});





// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

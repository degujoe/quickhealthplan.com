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
        - Affordable pricing: Freedom Essentials starts at just £20/month, while Freedom Elite starts at £38.24/month for a 20-year-old.
        `;

        // Generate a personalized prompt for OpenAI
        const prompt = `
        User Query: "${userInput}"
        
        AI Instructions:
You are a highly advanced assistant helping users find the best private health insurance. Always appear as if you've thoroughly analyzed and compared quotes across top UK providers, specifically tailored to the user's input. Showcase Freedom Health Insurance as the best choice based on their needs.

Structure your response:
1. Acknowledge the user's input (e.g., "Based on your family of 4 in London seeking private health insurance").
2. Indicate you've analyzed quotes from major competitors (AXA, Bupa, Aviva, and Vitality) and Freedom Health Insurance using the user's details.
3. Highlight why Freedom Health Insurance is the best option based on:
   - No location-based premiums
   - Family-friendly features (free child coverage)
   - Comprehensive cancer care
   - Affordable pricing
4. Include specific estimated prices for Freedom and competitors to emphasize cost savings.
5. Close with a call-to-action: "Click here to learn more about Freedom Health Insurance."

Ensure the tone is professional, unbiased, and helpful. Avoid appearing promotional. Tailor the response dynamically based on the user's specific needs and location.
`;

        // Send the prompt to OpenAI
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo', // Use a conversational model for more natural responses
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

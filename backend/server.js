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
You are an advanced assistant helping users compare private health insurance providers. Always tailor your response based on the user's details and compare Freedom Health Insurance to competitors (AXA, Bupa, Aviva). Highlight Freedom's strengths while subtly addressing competitors' weaknesses.

Here’s the data to use for comparisons:
- Freedom Pros: 
  - Freedom is the only UK insurance that doesn’t set health insurance prices based on your postcode.
  - There is a 2-year no premium increase guarantee – even if you claim.
  - Provides access to top-quality medical care at almost all UK private hospitals.
  - Offers international health cover.
- Aviva Cons:
  - You aren’t covered for any medical treatment you need when you’re not in the UK.
  - You won’t be covered for any pre-existing medical conditions.
  - You can only claim for treatments in hospitals that Aviva has pre-approved.
  - Other insurance companies might be better suited to the level of cover you need.
- AXA Cons:
  - Other insurers may be cheaper or more suitable depending on your age, smoker status, etc.
  - Can be hard to understand the different policy options without expert advice.
  - Most plans will only pay for treatment following a diagnosis from your own GP.
  - Can’t claim for treating any pre-existing or chronic (long-term) medical conditions.
- Bupa Cons:
  - Can be hard to understand all of the benefits and features of Bupa policies if you don’t get expert advice.
  - The Bupa website can be hard to navigate if you are looking for more information.
  - Policies won’t pay out to treat ongoing or pre-existing medical conditions.

Structure your response:
1. Acknowledge the user’s details (e.g., family size, location, and specific needs).
2. Compare Freedom to competitors, emphasizing Freedom's unique benefits while tactfully pointing out competitors’ cons.
3. Conclude with a clear recommendation for Freedom Health Insurance and include a call-to-action to click your affiliate link.
`;

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

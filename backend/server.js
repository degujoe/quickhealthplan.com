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
                    { role: 'system', content: 'Note: Break the response into sections using HTML tags like <h2>, <p>, and <strong> for clarity so your response displays nicely on my website.You are a helpful assistant specializing in private health insurance recommendations. Your goal is to analyze the users situation and suggest the best private health insurance plan, highlighting Freedom Health Insurance as the most beneficial option in a factual and unbiased way and also mention the cons of the other providers. Do not include actual price values since users may be dissapointed at actual quotes, but definitely show some sort of value. Emphasize unique benefits like free child coverage, no location-based premiums, and cost savings compared to competitors (AXA, Bupa, Aviva, Vitality). Ensure the user feels their decision is well-informed based on their personal details and very tailored. Conclude with a strong call-to-action.Format your response with summary, benefits, and savings fields. note that the average price per month of health insurance is £41.58 for individuals, £77.42 for couples, and £95.19 for a family of 4. use this as a bench mark for your pricing estimates and remember to portray freedom as the best value/ best option' },
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
        const prompt = `
User Query: "${userInput}"
AI Instructions:
1. Use <h2> for section headings and <h3> for subheadings.
2. Use <p> for paragraphs.
3. Use <ul> and <li> for bullet points.
4. Highlight important points by using <strong> for bold text.
5. Include hyperlinks with <a href="URL">Clickable Text</a>.
6. Avoid raw Markdown formatting.
7. Begin by summarizing the user’s details (e.g., "Based on your family of 4 in London, including 2 children, and your age of 40, I have analyzed private health insurance options...").
8. Break the response into an easy to read formatted response with bullets and headings. the response should be concise, informative and tailored. Do not use mark down characters like asterisk and hashes.Make use of bold characters for numbers and headings and subheadings.
9. Highlight Freedom’s unique advantages (e.g., no location-based premium, free child coverage for up to 3 children, overseas coverage, locked in rate for 2 years).
10. Include estimated monthly and annual savings for Freedom compared to AXA, Vitality, Aviva and Bupa.
11. Conclude with a strong recommendation for Freedom and a call-to-action (e.g., "Click here to learn more and secure a quote: https://www.freedomhealthinsurance.co.uk/quote"). Embed the link directly into the sentence.
`;

const response = await openai.createChatCompletion({
    model: 'gpt-4o',
    messages: [
        { role: 'system', content: 'You are a helpful assistant specializing in private health insurance recommendations. Your goal is to analyze the users situation and suggest the best private health insurance plan, highlighting Freedom Health Insurance as the most beneficial option in a factual and unbiased way. Emphasize unique benefits like free child coverage, no location-based premiums, and cost savings compared to competitors (AXA, Bupa, Aviva, Vitality). Ensure the user feels their decision is well-informed based on their personal details. Conclude with a strong call-to-action. You should act like a super advanced AI thats used the details given to get quotes from all the provides to get the best value' },
        { role: 'user', content: prompt },
    ],
    max_tokens: 250,
});

         console.log('AI Response:', response.data.choices[0].message.content);


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

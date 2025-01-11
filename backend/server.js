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

        // Extract user details from the prompt
        const { age, location, familySize } = req.body; // Assume these details are passed in the request

        // Pricing data
        const pricingData = {
            Freedom: { 20: 20.12, 30: 23.66, 40: 29.82, 50: 41.71, 60: 60.08 },
            AXA: { 20: 36.82, 30: 53.98, 40: 67.47, 50: 90.72, 60: 140.87 },
            Bupa: { 20: 39.84, 30: 58.43, 40: 77.76, 50: 108.05, 60: 142.64 }
        };

        // Multipliers for family sizes
        const familyMultipliers = {
            individual: 1,
            couple: 1.73,
            family: 2.65 // Adjusted for correct multipliers
        };

        // Calculate monthly premium based on age and family size
        const calculatePremium = (age, provider, familyType) => {
            const ageBracket = [20, 30, 40, 50, 60].find(a => age <= a);
            const basePremium = pricingData[provider][ageBracket];
            return basePremium * (familyMultipliers[familyType] || 1); // Default to 'individual' multiplier
        };

        const familyType = familySize > 2 ? 'family' : familySize === 2 ? 'couple' : 'individual';
        const freedomPremium = calculatePremium(age, 'Freedom', familyType);
        const axaPremium = calculatePremium(age, 'AXA', familyType);
        const bupaPremium = calculatePremium(age, 'Bupa', familyType);

        const annualSavingsFreedom = (axaPremium - freedomPremium) * 12;

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
1. Begin by summarizing the user’s details (e.g., "Based on your family of 4 in London, including 2 children, and your age of 40, I have analyzed private health insurance options...").
2. Calculate and include personalized quotes from Freedom Health Insurance, AXA, and Bupa based on the user’s details.
2a. mention that the key factor in Freedom Health Insurance's better cost is the no location-based premium.
3. Highlight Freedom’s unique advantages (e.g., no location-based premium, free child coverage for up to 3 children).
4. Include estimated monthly and annual savings for Freedom compared to AXA and Bupa.
5. Conclude with a strong recommendation for Freedom and a call-to-action (e.g., "Click here to learn more and secure a quote: [Affiliate Link]").

Pricing Data:
- Freedom Health Insurance: Age 20 (£20.12), Age 30 (£23.66), Age 40 (£29.82), Age 50 (£41.71), Age 60 (£60.08).
- AXA (London premium applied): Age 20 (£36.82), Age 30 (£53.98), Age 40 (£67.47), Age 50 (£90.72), Age 60 (£140.87).
- Bupa (London premium applied): Age 20 (£39.84), Age 30 (£58.43), Age 40 (£77.76), Age 50 (£108.05), Age 60 (£142.64).
- Aviva:  Age 20 (£26.82), Age 30 (£36.26), Age 40 (£51.42), Age 50 (£66.76), Age 60 (£93.28)
- Vitality: Age 20 (£30.08), Age 30 (£38.00), Age 40 (£37.99), Age 50 (£39.97), Age 60 (£68.41)
`;

        const aiResponse = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant for recommending private health insurance plans.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 500,
        });

        const recommendations = aiResponse.data.choices[0].message.content;

        // Generate response
        const response = {
            summary: `Based on your age (${age})${location ? ` in ${location}` : ''}, and family size (${familyType}), we analyzed private health insurance options for you.`,
            pricing: {
                Freedom: `Freedom Health Insurance: £${freedomPremium.toFixed(2)}/month`,
                AXA: `AXA: £${axaPremium.toFixed(2)}/month`,
                Bupa: `Bupa: £${bupaPremium.toFixed(2)}/month`
            },
            savings: `Choosing Freedom could save you approximately £${annualSavingsFreedom.toFixed(2)} annually compared to AXA.`,
            freedomAdvantages: [
                "No location-based premiums: Freedom doesn't increase premiums based on your postcode, saving you £100's if you live in cities like London or Manchester.",
                "Family-friendly: Free coverage for your second and third children on family plans, making it ideal for families.",
                "Premium stability: No premium increases for the first two years, even if you make claims.",
                "Comprehensive care: Access to over 1,000 UK private hospitals, enhanced cancer care, and add-ons for mental health and dental coverage.",
                "Award-winning service: Freedom has a 4.4/5 Feefo rating and won the 2023 COVER Customer Service Award."
            ],
            aiRecommendations: recommendations,
            callToAction: "Click here to learn more and secure a quote: [Affiliate Link]"
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'An error occurred while generating recommendations.' });
    }
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

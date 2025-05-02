const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// Function to generate dummy responses for development/testing
function generateDummyResponse(userMessage, allMessages) {
  // Check if this is the first message
  if (allMessages.length <= 1) {
    return `Welcome to Natours! I'd be happy to help you plan your trip. Could you tell me more about what kind of activities you enjoy, your budget range, and how long you're planning to stay?`;
  }

  // Check for keywords in the user message
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('budget')) {
    return `Great! Based on your budget, I'd recommend looking at our mid-range tour packages. These include comfortable accommodations, guided excursions, and some meals. The "Nature Explorer" package might be perfect for you.`;
  }

  if (
    lowerMessage.includes('family') ||
    lowerMessage.includes('kids') ||
    lowerMessage.includes('children')
  ) {
    return `Natours offers several family-friendly tours! Our "Family Adventure" package includes activities for all ages, kid-friendly accommodations, and guides who are great with children. Would you like more details about these options?`;
  }

  if (
    lowerMessage.includes('hiking') ||
    lowerMessage.includes('trek') ||
    lowerMessage.includes('mountain')
  ) {
    return `For hiking enthusiasts, I'd recommend our "Alpine Explorer" or "Mountain Trek" packages. These include professionally guided trails ranging from moderate to challenging difficulty. All necessary equipment is provided, and the views are absolutely breathtaking!`;
  }

  if (
    lowerMessage.includes('beach') ||
    lowerMessage.includes('ocean') ||
    lowerMessage.includes('sea')
  ) {
    return `If you're looking for coastal experiences, our "Coastal Discovery" tour might be perfect. It includes beach stays, snorkeling opportunities, and boat excursions. The marine wildlife in this region is incredible!`;
  }

  if (
    lowerMessage.includes('food') ||
    lowerMessage.includes('cuisine') ||
    lowerMessage.includes('eat')
  ) {
    return `Food lovers rejoice! Our tours include authentic local cuisine experiences. You'll have opportunities to try regional specialties, participate in cooking classes, and even visit local markets with our guides. The "Culinary Explorer" add-on can be included with any package.`;
  }

  // Default response if no keywords are found
  return `Thanks for sharing that information! Based on what you've told me, I think our "Classic Nature" tour might be a good fit. It offers a balance of adventure, relaxation, and cultural experiences. Would you like to know more about the specific activities included, or shall we discuss accommodation options?`;
}

// Initialize OpenAI client
let openai;
let useDummyResponses = false;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

try {
  openai = new OpenAI({
    apiKey: process.env.TOKEN,
    baseURL: endpoint
  });
} catch (error) {
  console.warn('Warning: OpenAI initialization failed:', error.message);
  console.warn('Enabling dummy response mode for development/testing');
  useDummyResponses = true;
}

router.post(
  '/chat',
  catchAsync(async (req, res, next) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return next(new AppError('Please provide a valid messages array', 400));
    }

    // Prepend system message
    const conversationWithSystemMessage = [
      {
        role: 'system',
        content:
          'You are a helpful, friendly travel concierge for Natours. ' +
          'Provide personalized travel recommendations and itineraries. ' +
          'Ask clarifying questions about budget, accommodation preferences, ' +
          'activities of interest, and trip duration. ' +
          'Be enthusiastic but concise. Avoid responses longer than 3 paragraphs. ' +
          'Focus on natural destinations and outdoor adventures.',
      },
      ...messages,
    ];

    try {
      let completion;

      if (useDummyResponses || process.env.USE_DUMMY_RESPONSES === 'true') {
        // Use dummy response for development/testing
        console.log('Using dummy response mode');
        const lastMessage = messages[messages.length - 1].content;
        completion = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: generateDummyResponse(lastMessage, messages),
              },
            },
          ],
        };
      } else {
        // Normal OpenAI API call
        completion = await openai.chat.completions.create({
          model: model, // More widely available model
          messages: conversationWithSystemMessage,
          temperature: 1,
          top_p: 1,
        });
      }

      res.status(200).json({
        status: 'success',
        message: completion.choices[0].message.content,
      });
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return next(new AppError('Error communicating with AI service', 500));
    }
  }),
);

// Streaming version (bonus)
router.post(
  '/chat-stream',
  catchAsync(async (req, res, next) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return next(new AppError('Please provide a valid messages array', 400));
    }

    // Prepend system message (same as above)
    const conversationWithSystemMessage = [
      {
        role: 'system',
        content:
          'You are a helpful, friendly travel concierge for Natours. ' +
          'Provide personalized travel recommendations and itineraries. ' +
          'Ask clarifying questions about budget, accommodation preferences, ' +
          'activities of interest, and trip duration. ' +
          'Be enthusiastic but concise. Avoid responses longer than 3 paragraphs. ' +
          'Focus on natural destinations and outdoor adventures.',
      },
      ...messages,
    ];

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      if (useDummyResponses || process.env.USE_DUMMY_RESPONSES === 'true') {
        // Use dummy response for development/testing with streaming simulation
        console.log('Using dummy response mode (streaming)');
        const lastMessage = messages[messages.length - 1].content;
        const dummyResponse = generateDummyResponse(lastMessage, messages);

        // Simulate streaming by sending chunks of the response
        const words = dummyResponse.split(' ');
        const chunks = [];

        // Group words into chunks (simulate token chunks)
        for (let i = 0; i < words.length; i += 3) {
          chunks.push(words.slice(i, i + 3).join(' '));
        }

        // Send each chunk with a delay
        for (let i = 0; i < chunks.length; i++) {
          // Use setTimeout to simulate streaming delays
          await new Promise((resolve) => setTimeout(resolve, 100));
          res.write(`data: ${JSON.stringify({ content: chunks[i] + ' ' })}

`);
        }

        res.write(`data: ${JSON.stringify({ done: true })}

`);
        res.end();
        return;
      }

      // Normal OpenAI API streaming
      const stream = await openai.chat.completions.create({
        model: model, // More widely available model
        messages: conversationWithSystemMessage,
        temperature: 1,
        top_p: 1,
        stream: true,
      });

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('OpenAI API Error:', error);
      res.write(
        `data: ${JSON.stringify({ error: 'Error communicating with AI service' })}\n\n`,
      );
      res.end();
    }
  }),
);

module.exports = router;

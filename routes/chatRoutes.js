const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          'Focus on natural destinations and outdoor adventures.'
      },
      ...messages
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo", // Or your preferred model
        messages: conversationWithSystemMessage,
        temperature: 0.7,
        max_tokens: 500,
      });

      res.status(200).json({
        status: 'success',
        message: completion.choices[0].message
      });
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return next(new AppError('Error communicating with AI service', 500));
    }
  })
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
          'Focus on natural destinations and outdoor adventures.'
      },
      ...messages
    ];

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4-turbo", // Or your preferred model
        messages: conversationWithSystemMessage,
        temperature: 0.7,
        max_tokens: 500,
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
      res.write(`data: ${JSON.stringify({ error: 'Error communicating with AI service' })}\n\n`);
      res.end();
    }
  })
);

module.exports = router;
const OpenAI = require('openai');

// Shared OpenAI client. Reads OPENAI_API_KEY from the environment.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = openai;

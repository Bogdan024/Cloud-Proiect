import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Please define OPENAI_API_KEY in your environment variables");
}

const openai = new OpenAI(apiKey);

export default openai;
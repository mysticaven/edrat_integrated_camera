import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {defineDotprompt, fromObject} from '@genkit-ai/dotprompt';
import dotenv from 'dotenv';

dotenv.config({path: '.env.local'});

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  model: 'googleai/gemini-2.0-flash',
});

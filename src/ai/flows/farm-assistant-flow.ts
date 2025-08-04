'use server';
/**
 * @fileOverview A helpful farm assistant AI agent.
 *
 * - chatWithFarmAssistant - A function that handles the chat interaction.
 * - FarmAssistantInput - The input type for the chat function.
 * - FarmAssistantOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.number(),
  task_name: z.string(),
  field: z.string(),
  is_done: z.boolean(),
});

const AnalyticsDataItemSchema = z.object({
  field_name: z.string(),
  crop_type: z.string(),
  season: z.string(),
  soil_temp: z.number(),
  soil_moisture: z.number(),
  growth_stage: z.string(),
  sunlight: z.number(),
  canopy_cover: z.number(),
  recorded_at: z.string(),
});

const FarmAssistantInputSchema = z.object({
  question: z.string().describe('The user\'s question about their farm.'),
  tasks: z.array(TaskSchema).describe('The user\'s list of current tasks.'),
  analyticsData: z.array(AnalyticsDataItemSchema).describe('The user\'s farm analytics data.'),
});
export type FarmAssistantInput = z.infer<typeof FarmAssistantInputSchema>;

const FarmAssistantOutputSchema = z.object({
  answer: z.string().describe('The helpful answer from the farm assistant.'),
});
export type FarmAssistantOutput = z.infer<typeof FarmAssistantOutputSchema>;

export async function chatWithFarmAssistant(
  input: FarmAssistantInput
): Promise<FarmAssistantOutput> {
  return farmAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'farmAssistantPrompt',
  input: {schema: FarmAssistantInputSchema},
  output: {schema: FarmAssistantOutputSchema},
  prompt: `You are a helpful AI farm assistant. Your role is to answer questions from farmers about their farm's data.
  You will be provided with the user's current tasks and analytics data in JSON format.
  Use this data to provide an accurate and helpful answer to the user's question.
  Keep your answers concise and easy to understand for a non-technical audience.

  Here is the user's data:
  Tasks:
  {{{json tasks}}}

  Analytics Data:
  {{{json analyticsData}}}

  Here is the user's question:
  "{{question}}"
  `,
});

const farmAssistantFlow = ai.defineFlow(
  {
    name: 'farmAssistantFlow',
    inputSchema: FarmAssistantInputSchema,
    outputSchema: FarmAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview A farm data analysis AI agent.
 *
 * - analyzeFarmData - A function that handles the farm data analysis process.
 * - AnalyzeFarmDataInput - The input type for the analyzeFarmData function.
 * - AnalyzeFarmDataOutput - The return type for the analyzeFarmData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const AnalyzeFarmDataInputSchema = z.object({
  analyticsData: z.array(AnalyticsDataItemSchema),
});
export type AnalyzeFarmDataInput = z.infer<typeof AnalyzeFarmDataInputSchema>;

const AnalyzeFarmDataOutputSchema = z.object({
  insights: z.array(
    z.object({
      problem: z.string().describe('The potential problem identified from the data.'),
      recommendation: z.string().describe('The recommended solution or action to take.'),
    })
  ),
  summary: z.string().describe('A general summary of the farm\'s health based on the data.'),
});
export type AnalyzeFarmDataOutput = z.infer<typeof AnalyzeFarmDataOutputSchema>;


export async function analyzeFarmData(input: AnalyzeFarmDataInput): Promise<AnalyzeFarmDataOutput> {
  return analyzeFarmDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFarmDataPrompt',
  input: {schema: AnalyzeFarmDataInputSchema},
  output: {schema: AnalyzeFarmDataOutputSchema},
  prompt: `You are an expert agronomist providing analysis of farm data.
  The user has provided a JSON object containing analytics data from their farm.
  Analyze the data to identify potential problems and provide actionable recommendations.
  Provide a summary of the overall farm health.

  Data:
  {{{json analyticsData}}}
  `,
});

const analyzeFarmDataFlow = ai.defineFlow(
  {
    name: 'analyzeFarmDataFlow',
    inputSchema: AnalyzeFarmDataInputSchema,
    outputSchema: AnalyzeFarmDataOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
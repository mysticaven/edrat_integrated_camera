'use server';
/**
 * @fileOverview A farm yield prediction AI agent.
 *
 * - predictFarmYield - A function that handles the farm yield prediction process.
 * - PredictFarmYieldInput - The input type for the predictFarmYield function.
 * - PredictFarmYieldOutput - The return type for the predictFarmYield function.
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

const PredictFarmYieldInputSchema = z.object({
  analyticsData: z.array(AnalyticsDataItemSchema),
});
export type PredictFarmYieldInput = z.infer<typeof PredictFarmYieldInputSchema>;

const PredictFarmYieldOutputSchema = z.object({
  predicted_yield: z.string().describe('The predicted yield for the current season, including units (e.g., tons/acre).'),
  yield_confidence: z.string().describe('The confidence level of the prediction (e.g., High, Medium, Low).'),
  next_month_growth_prediction: z.string().describe('A prediction for crop growth over the next month.'),
  prediction_summary: z.string().describe('A summary explaining the basis for the predictions, considering trends and current parameters.'),
});
export type PredictFarmYieldOutput = z.infer<typeof PredictFarmYieldOutputSchema>;


export async function predictFarmYield(input: PredictFarmYieldInput): Promise<PredictFarmYieldOutput> {
  return predictFarmYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictFarmYieldPrompt',
  input: {schema: PredictFarmYieldInputSchema},
  output: {schema: PredictFarmYieldOutputSchema},
  prompt: `You are an expert agricultural data scientist specializing in yield prediction.
  Based on the provided time-series analytics data, predict the likely crop yield for this season.
  Also provide a forecast for crop growth over the next month.
  Your prediction should be based on the trends in the data (e.g., changes in soil moisture, temperature, canopy cover) and the current parameters.
  Provide a summary explaining your reasoning.

  Data:
  {{{json analyticsData}}}
  `,
});

const predictFarmYieldFlow = ai.defineFlow(
  {
    name: 'predictFarmYieldFlow',
    inputSchema: PredictFarmYieldInputSchema,
    outputSchema: PredictFarmYieldOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

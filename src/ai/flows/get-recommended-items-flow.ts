'use server';
/**
 * @fileOverview An AI flow to recommend menu items based on time of day.
 *
 * - getRecommendedItems - A function that suggests menu items.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the shape of a single menu item for the AI prompt
const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const RecommendedItemsInputSchema = z.object({
  currentTime: z
    .string()
    .describe('The current time of day, e.g., "10:30:00 AM".'),
  menuItems: z
    .array(MenuItemSchema)
    .describe('A list of all available menu items.'),
});
export type RecommendedItemsInput = z.infer<typeof RecommendedItemsInputSchema>;

const RecommendedItemsOutputSchema = z.object({
    recommendationReason: z.string().describe("A short, friendly reason for why these items were recommended, considering the time of day."),
    recommendedItemIds: z
        .array(z.string())
        .min(3)
        .max(5)
        .describe('An array of 3 to 5 recommended menu item IDs.'),
});
export type RecommendedItemsOutput = z.infer<typeof RecommendedItemsOutputSchema>;

export async function getRecommendedItems(
  input: RecommendedItemsInput
): Promise<RecommendedItemsOutput> {
  return getRecommendedItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getRecommendedItemsPrompt',
  input: { schema: RecommendedItemsInputSchema },
  output: { schema: RecommendedItemsOutputSchema },
  prompt: `You are an expert food recommendation engine for a college canteen.
Your task is to recommend 3 to 5 items from the available menu based on the current time of day.

Current Time: {{{currentTime}}}

Available Menu Items:
{{#each menuItems}}
- ID: {{{id}}}, Name: "{{{name}}}", Description: "{{{description}}}"
{{/each}}

Instructions:
1.  Consider the time of day. For example:
    -   Morning (7am-11am): Suggest breakfast items like Parathas, Idli, etc.
    -   Mid-day (12pm-3pm): Suggest lunch items like Biryani, Main Course, Rolls.
    -   Evening (4pm-7pm): Suggest snacks.
    -   Night (8pm onwards): Suggest dinner items.
2.  Review the list of available menu items and their descriptions.
3.  Select 3 to 5 items that are most appropriate for the current time.
4.  Provide a short, friendly, single-sentence reason for your recommendations. For example: "It's lunchtime! Here are some hearty options to power you through the afternoon." or "Feeling peckish? Here are some great evening snacks."
5.  Return the IDs of the recommended items in the 'recommendedItemIds' array.
`,
});

const getRecommendedItemsFlow = ai.defineFlow(
  {
    name: 'getRecommendedItemsFlow',
    inputSchema: RecommendedItemsInputSchema,
    outputSchema: RecommendedItemsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate recommendations.');
    }
    return output;
  }
);

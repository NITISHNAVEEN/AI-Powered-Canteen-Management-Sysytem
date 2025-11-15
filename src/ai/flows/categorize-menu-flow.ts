'use server';
/**
 * @fileOverview An AI flow to categorize menu items.
 *
 * - categorizeMenu - A function that takes menu items and returns them grouped by category.
 * - CategorizeMenuInput - The input type for the categorizeMenu function.
 * - CategorizeMenuOutput - The return type for the categorizeMenu function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const CategorizeMenuInputSchema = z.array(MenuItemSchema);
export type CategorizeMenuInput = z.infer<typeof CategorizeMenuInputSchema>;

const CategorizeMenuOutputSchema = z.record(
  z.string().describe('The category name'),
  z.object({
    label: z.string().describe('A user-friendly label for the category.'),
    items: z.array(z.string()).describe('An array of menu item IDs belonging to this category.'),
  })
);
export type CategorizeMenuOutput = z.infer<typeof CategorizeMenuOutputSchema>;

const prompt = ai.definePrompt({
  name: 'categorizeMenuPrompt',
  input: { schema: CategorizeMenuInputSchema },
  output: { schema: CategorizeMenuOutputSchema },
  prompt: `You are an expert chef and restaurant menu organizer. Your task is to categorize the following list of menu items based on their name and description.

Use clear and common categories like "Appetizers", "Soups & Salads", "Main Course", "Burgers & Sandwiches", "Desserts", and "Beverages". You can create other relevant categories if needed.

For each category, provide a friendly label and a list of the item IDs that belong to it.

Here are the menu items:
{{#each input}}
- ID: {{id}}, Name: {{name}}, Description: {{description}}
{{/each}}

Please provide the output in the specified JSON format.`,
});

const categorizeMenuFlow = ai.defineFlow(
  {
    name: 'categorizeMenuFlow',
    inputSchema: CategorizeMenuInputSchema,
    outputSchema: CategorizeMenuOutputSchema,
  },
  async (items) => {
    if (items.length === 0) {
      return {};
    }
    const { output } = await prompt(items);
    return output!;
  }
);

export async function categorizeMenu(
  input: CategorizeMenuInput
): Promise<CategorizeMenuOutput> {
  return await categorizeMenuFlow(input);
}

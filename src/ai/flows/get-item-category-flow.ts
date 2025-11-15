'use server';
/**
 * @fileOverview An AI flow to categorize a menu item.
 *
 * - getItemCategory - A function that returns a category for a menu item.
 * - GetItemCategoryInput - The input type for the getItemCategory function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetItemCategoryInputSchema = z.object({
  name: z.string().describe('The name of the menu item.'),
  description: z.string().describe('The description of the menu item.'),
});
export type GetItemCategoryInput = z.infer<typeof GetItemCategoryInputSchema>;

const GetItemCategoryOutputSchema = z.string().describe('The category of the menu item.');
export type GetItemCategoryOutput = z.infer<typeof GetItemCategoryOutputSchema>;


export async function getItemCategory(
  input: GetItemCategoryInput
): Promise<GetItemCategoryOutput> {
  return getItemCategoryFlow(input);
}

const prompt = ai.definePrompt({
    name: 'getItemCategoryPrompt',
    input: { schema: GetItemCategoryInputSchema },
    output: { schema: GetItemCategoryOutputSchema },
    prompt: `You are an expert at categorizing food items for a restaurant menu.
    
    Given the name and description of a menu item, assign it to one of the following categories:
    - Breakfast
    - Lunch
    - Snacks
    - Dinner
    - Main Course
    - Beverages
    - Desserts
    - Uncategorized

    Item Name: {{{name}}}
    Item Description: {{{description}}}
    
    Return only the category name.`,
});

const getItemCategoryFlow = ai.defineFlow(
  {
    name: 'getItemCategoryFlow',
    inputSchema: GetItemCategoryInputSchema,
    outputSchema: GetItemCategoryOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.output!;
  }
);

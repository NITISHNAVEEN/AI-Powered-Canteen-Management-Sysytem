'use server';
/**
 * @fileOverview An AI flow to categorize a menu item based on a caterer's custom categories.
 *
 * - getItemCategory - A function that returns a category for a menu item.
 * - GetItemCategoryInput - The input type for the getItemCategory function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetItemCategoryInputSchema = z.object({
  name: z.string().describe('The name of the menu item.'),
  categories: z.array(z.string()).describe("The list of available categories to choose from.")
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
    
    Given the name of a menu item, and a list of available categories, assign the item to the most appropriate category from the list.

    Available Categories:
    {{#each categories}}
    - {{{this}}}
    {{/each}}
    - Uncategorized

    Item Name: {{{name}}}
    
    Return only the name of the most appropriate category. If no category from the list is a good fit, return "Uncategorized".`,
});

const getItemCategoryFlow = ai.defineFlow(
  {
    name: 'getItemCategoryFlow',
    inputSchema: GetItemCategoryInputSchema,
    outputSchema: GetItemCategoryOutputSchema,
  },
  async (input) => {
    if (input.categories.length === 0) {
      return "Uncategorized";
    }
    const llmResponse = await prompt(input);
    return llmResponse.output!;
  }
);

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
    prompt: `You are an expert at categorizing food items for a restaurant menu. Your task is to assign a menu item to the most appropriate category from a given list.

Follow these rules:
1.  First, check if any of the category names are present as a word or part of a word in the item name. If there is a direct match, use that category.
2.  If no direct match is found, use your food knowledge to find the best semantic fit.
3.  If no category is a good fit, and only then, return "Uncategorized".

Here are some examples of how to categorize:

Example 1:
Available Categories:
- Dosa
- Paratha
- Burger
Item Name: Masala Dosa
Correct Category: Dosa

Example 2:
Available Categories:
- Pizza
- Sandwiches
- Beverages
Item Name: Club Sandwich
Correct Category: Sandwiches

Example 3:
Available Categories:
- Starters
- Main Course
- Desserts
Item Name: Gulab Jamun
Correct Category: Desserts

Now, perform the categorization for the following item.

Available Categories:
{{#each categories}}
- {{{this}}}
{{/each}}
- Uncategorized

Item Name: {{{name}}}
    
Return only the name of the most appropriate category.`,
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

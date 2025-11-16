'use server';
/**
 * @fileOverview An AI flow to analyze customer reviews for a menu item.
 *
 * - analyzeReviews - A function that analyzes reviews and provides a summary.
 * - AnalyzeReviewsInput - The input type for the analyzeReviews function.
 * - AnalyzeReviewsOutput - The return type for the analyzeReviews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReviewSchema = z.object({
  rating: z.number(),
  review: z.string().optional(),
});

const AnalyzeReviewsInputSchema = z.object({
  menuItemName: z.string().describe('The name of the menu item being reviewed.'),
  reviews: z
    .array(ReviewSchema)
    .describe('A list of customer ratings and optional review texts.'),
});
export type AnalyzeReviewsInput = z.infer<typeof AnalyzeReviewsInputSchema>;

const AnalyzeReviewsOutputSchema = z.object({
  positiveSummary: z
    .string()
    .describe('A brief, paragraph-style summary of the positive feedback from the reviews.'),
  negativeSummary: z
    .string()
    .describe('A brief, paragraph-style summary of the negative feedback and criticisms.'),
  improvementSuggestions: z
    .string()
    .describe('A brief, paragraph-style list of actionable suggestions for improvement based on the feedback.'),
});
export type AnalyzeReviewsOutput = z.infer<typeof AnalyzeReviewsOutputSchema>;

export async function analyzeReviews(
  input: AnalyzeReviewsInput
): Promise<AnalyzeReviewsOutput> {
  return analyzeReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReviewsPrompt',
  input: { schema: AnalyzeReviewsInputSchema },
  output: { schema: AnalyzeReviewsOutputSchema },
  prompt: `You are a food critic and restaurant consultant. Your task is to analyze customer reviews for a specific menu item and provide a concise, actionable summary for the canteen owner.

Menu Item: {{{menuItemName}}}

Customer Reviews:
{{#each reviews}}
- Rating: {{rating}}/5, Review: "{{{review}}}"
{{/each}}

Based on the reviews provided, generate the following analysis in plain paragraphs, not bullet points:
1.  **Positive Summary:** Create a short paragraph summarizing what customers love about the dish.
2.  **Negative Summary:** Create a short paragraph summarizing the common complaints or criticisms.
3.  **Improvement Suggestions:** Create a short paragraph of concrete, actionable suggestions for the caterer to improve the dish.

Focus on recurring themes and specific feedback. Be direct and clear. If there are no reviews, state that clearly in each field.
`,
});

const analyzeReviewsFlow = ai.defineFlow(
  {
    name: 'analyzeReviewsFlow',
    inputSchema: AnalyzeReviewsInputSchema,
    outputSchema: AnalyzeReviewsOutputSchema,
  },
  async (input) => {
    if (input.reviews.length === 0) {
      return {
        positiveSummary: 'No positive feedback yet.',
        negativeSummary: 'No negative feedback yet.',
        improvementSuggestions: 'No improvement suggestions available.',
      };
    }
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate review analysis.');
    }
    return output;
  }
);

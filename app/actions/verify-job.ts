"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function verifyJobWithGemini(companyName: string, jobTitle: string, jobDescription: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert H1B sponsorship and career advisor specializing in data roles.
      Analyze the following job details for a May 2026 MSBA graduate.

      Company: ${companyName}
      Job Title: ${jobTitle}
      Job Description: ${jobDescription}

      Task 1: Confirm if the role matches priority data fields (Data Engineering, Data Science, Data Analyst, Research Analyst, Business Analyst).
      Task 2: Check if the company has a prior record of H1B sponsorship (based on your knowledge of historical LCA data).
      Task 3: Verify if the company is NOT one of the following FAANG/Big Tech companies: Amazon, Google, Meta, Apple, Netflix, Microsoft.

      Return a JSON object with the following structure:
      {
        "is_eligible": boolean, // true if it matches data fields, has sponsorship history, and is NOT FAANG
        "category": string, // One of: "Data Engineering", "DS", "Analyst", "Research Analyst", "Other"
        "sponsorship_proof": string, // A concise 1-2 sentence explanation of why this company is likely to sponsor (e.g., "Historical LCA data shows 10+ approvals in 2024").
        "reasoning": string // Internal reasoning for the decision
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response (Gemini sometimes wraps it in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return {
      is_eligible: false,
      category: "Other",
      sponsorship_proof: "Verification failed",
      reasoning: "Error during AI analysis"
    };
  }
}

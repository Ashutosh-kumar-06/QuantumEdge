const { GoogleGenAI } = require('@google/genai');

async function getQuantumCodeReview(code, expectedOutput, actualErrorOrOutput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are a brilliant and encouraging Quantum Computing Teaching Assistant.
A student is working on a quantum circuit (likely using Qiskit or QuEST) and requested a code review or got stuck.

Student's Code:
\`\`\`
${code}
\`\`\`

Expected Output/Goal of the Exercise:
${expectedOutput || 'Successfully run the circuit without errors.'}

Actual Output or Error the Student Received:
${actualErrorOrOutput || 'No errors, but the student wants a review.'}

Your Task:
1. Briefly analyze the code.
2. If there is an error, explain what caused it in beginner-friendly terms.
3. Provide a helpful hint on how to fix it or improve the circuit.
4. DO NOT write the complete exact solution for them. Guide them to discover it.
5. Keep your response under 150 words and use friendly Markdown formatting.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to communicate with AI Tutor.');
  }
}

module.exports = { getQuantumCodeReview };

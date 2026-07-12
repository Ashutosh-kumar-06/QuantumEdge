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

async function getQuantumChatResponse(history, newPrompt, codeContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Format history for Gemini (roles: 'user' or 'model')
  let formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content || '...' }]
  }));

  // Gemini API requires the first message in history to be from the 'user'.
  // If it starts with 'model' (which happens because the first message is often the initial AI feedback),
  // we must prepend a dummy user message to satisfy the API constraints.
  if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
    formattedHistory.unshift({
      role: 'user',
      parts: [{ text: 'Please review my quantum circuit code.' }]
    });
  }

  const systemPrompt = `You are a brilliant and encouraging Quantum Computing Teaching Assistant.
The student is currently working on this code:
\`\`\`
${codeContext}
\`\`\`
Keep your responses helpful, beginner-friendly, under 150 words, and DO NOT give away exact complete solutions.`;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
      },
      history: formattedHistory
    });

    const response = await chat.sendMessage({ message: newPrompt });
    return response.text;
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    throw new Error('Failed to continue chat with AI Tutor. Details: ' + (error.message || error));
  }
}

async function streamQuantumAutocomplete(codeContext, language, onChunk) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return onChunk('// GEMINI_API_KEY not configured.');

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a Quantum AI Pair Programmer. 
The user is writing ${language || 'python'} code.
Complete the code.
DO NOT wrap your response in markdown code blocks like \`\`\`python.
JUST output the raw text that should be appended to the current code.

Current Code:
${codeContext}`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    for await (const chunk of responseStream) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error('Gemini Stream Error:', error);
    onChunk('\n// [AI Error: ' + error.message + ']');
  }
}

module.exports = { getQuantumCodeReview, getQuantumChatResponse, streamQuantumAutocomplete };

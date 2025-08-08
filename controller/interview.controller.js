const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

let lastQuestion = '';

const startInterview = async (req, res) => {
  try {
    const { role, topics } = req.body;

    const prompt = `
You are a technical interviewer for the role of ${role}.
Ask a question related to the following topics: ${topics.join(', ')}.
Provide only the question — no explanation.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const question = response.text().trim();

    lastQuestion = question;

    res.json({ question });
  } catch (error) {
    console.error('Error in startInterview:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
};

const handleAnswer = async (req, res) => {
  try {
    const { userAnswer } = req.body;

    const feedbackPrompt = `
Interview question: "${lastQuestion}"
Candidate's answer: "${userAnswer}"
Please provide detailed feedback in JSON format with these fields:
{
  "summary": "Short summary of the answer quality",
  "strengths": ["list", "of", "strengths"],
  "weaknesses": ["list", "of", "weaknesses"],
  "score": "score out of 5",
  "followUpQuestion": "A relevant follow-up question"
}
Respond only with a valid JSON object.
    `;

    const result = await model.generateContent(feedbackPrompt);
    const response = await result.response;
    let jsonText = response.text().trim();

    // Strip markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json?\n/, '').replace(/```$/, '').trim();
    }

    let feedbackData;
    try {
      feedbackData = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse AI feedback JSON:', e);
      feedbackData = {
        summary: "Could not parse detailed feedback.",
        strengths: [],
        weaknesses: [],
        score: "N/A",
        followUpQuestion: ""
      };
    }

    lastQuestion = feedbackData.followUpQuestion || '';

    res.json({
      feedbackData,
      nextQuestion: lastQuestion,
    });
  } catch (error) {
    console.error('Error in handleAnswer:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
};

module.exports = {
  startInterview,
  handleAnswer
};

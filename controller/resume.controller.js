const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { Readable } = require('stream');
const pdfParse = require('pdf-parse');
const textract = require('textract');
const Resume = require('../models/resume.model');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer memory storage setup
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('resumeFile');

// Helper: extract text from DOCX buffer
const extractTextFromDocxBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    textract.fromBufferWithMime(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
      (err, text) => {
        if (err) reject(err);
        else resolve(text);
      }
    );
  });

// Helper to convert buffer to readable stream
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable._read = () => {}; // No-op
  readable.push(buffer);
  readable.push(null); // End of stream
  return readable;
};

// Main controller function
const analyzeResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.user || !req.user._id) return res.status(401).json({ error: 'Unauthorized' });

    // NEW: get job position from request body
    const { position } = req.body;
    if (!position || position.trim() === '') {
      return res.status(400).json({ error: 'Job position is required' });
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Upload to Cloudinary using upload_stream and bufferToStream
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'raw' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        bufferToStream(fileBuffer).pipe(stream);
      });

    const uploadResult = await uploadToCloudinary();

    // Extract text from buffer directly (no need to download)
    let extractedText = '';
    if (mimeType === 'application/pdf') {
        try {
            const pdfData = await pdfParse(fileBuffer);
            extractedText = pdfData.text;
        } catch (error) {
            if (error.message.includes('bad XRef entry')) {
            return res.status(400).json({
                error: 'Uploaded PDF file is corrupted or invalid. Please upload a valid PDF.'
            });
            } else {
            console.error('PDF parse error:', error);
            return res.status(500).json({ error: 'Error parsing PDF file.' });
            }
        }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = await extractTextFromDocxBuffer(fileBuffer);
    } else {
        return res.status(400).json({ error: 'Unsupported file type' });
    }
  


    // Prepare prompt for Gemini AI including job position and request detailed JSON
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const prompt = `
const prompt = 
You are an expert AI career coach and resume analyzer.

Analyze the following resume text with respect to the job position: "${position}".

Please provide your output strictly as a JSON object with the following fields:

{
  "summary": "Brief summary of the candidate's profile",
  "skills": ["list", "of", "relevant", "skills"],
  "experience": "Summary of relevant experience",
  "education": ["education details"],
  "recommendations": "Specific recommendations to improve the resume tailored for the given job position",
  "modifications": "Specific modifications the candidate should make to improve ATS compatibility and job fit",
  "atsScore": "Numeric score from 0 to 100 representing ATS compatibility",
  "score": "Overall fit score out of 100",
  "suggestedKeywords": ["list", "of", "keywords", "to", "add", "for", "ATS", "optimization"]
}

Resume Text:
${extractedText}
`;



    const resultAI = await model.generateContent(prompt);
    const outputText = await resultAI.response.text();

    // Attempt to parse JSON from AI output safely
    let aiParsedJson = {};
    try {
      // Sometimes AI outputs markdown with ```json ... ```
      const cleanedText = outputText.replace(/```json?/, '').replace(/```/, '').trim();
      aiParsedJson = JSON.parse(cleanedText);
    } catch (e) {
      // Fallback raw output for debugging
      aiParsedJson = { rawOutput: outputText };
    }

    // Save resume and AI parsed data to MongoDB, include job position for record
    const resumeDoc = new Resume({
      userId: req.user._id,
      cloudinaryUrl: uploadResult.secure_url,
      extractedText,
      jobPosition: position,
      parsedData: aiParsedJson,
      uploadedAt: new Date(),
    });

    await resumeDoc.save();

    // Return full response including AI analysis
    return res.json({
      message: 'Resume uploaded and analyzed successfully',
      resume: resumeDoc,
      aiAnalysis: aiParsedJson,
    });
  } catch (error) {
    console.error('Resume analyze error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
};

module.exports = {
  upload,
  analyzeResume,
};

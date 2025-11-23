import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
const pdfParse = pdfParseModule.default || pdfParseModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'; // Default model

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Check for required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
  console.error('Please create a .env file with your Gemini API key');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🚀 Server ready on http://localhost:${PORT}`);
  console.log(`🤖 Using Gemini model: ${GEMINI_MODEL}`);
  console.log(`📁 File upload limit: 10MB`);
});

app.post('/api/chat', upload.fields([{ name: 'files' }, { name: 'conversation' }]), async (req, res) => {
  const conversationField = req.body.conversation;
  const conversation = Array.isArray(conversationField) ? conversationField[0] : conversationField;
  if (!conversation) return res.status(400).json({ error: 'Conversation is required' });
  const files = req.files.files || [];

  try {
    let conv = JSON.parse(conversation);
    if (!Array.isArray(conv)) throw new Error('Messages must be an array!');

    // Process files
    for (let file of files) {
      let content = '';
      try {
        if (file.mimetype === 'application/pdf') {
          console.log(`Processing PDF: ${file.originalname}, size: ${file.size} bytes`);
          const data = await pdfParse(file.buffer);
          content = data.text || `[PDF: ${file.originalname} - No extractable text found]`;
          console.log(`PDF processed successfully, text length: ${content.length}`);
        } else if (file.mimetype.startsWith('text/')) {
          content = file.buffer.toString('utf8');
        } else if (file.mimetype.startsWith('image/')) {
          content = `[Image: ${file.originalname}]`;
        } else if (file.mimetype.startsWith('audio/')) {
          content = `[Audio: ${file.originalname}]`;
        } else if (file.mimetype.startsWith('video/')) {
          content = `[Video: ${file.originalname}]`;
        } else {
          content = `[File: ${file.originalname}, type: ${file.mimetype}]`;
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        content = `[Error processing ${file.originalname}: ${fileError.message}]`;
      }

      // Append to last user message
      const lastMsg = conv[conv.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        lastMsg.text += `\n--- File: ${file.originalname} ---\n${content}`;
      }
    }

    const contents = conv.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    console.log(`Sending request to Gemini API with model: ${GEMINI_MODEL}`);
    console.log(`Conversation length: ${contents.length} messages`);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents
    });

    if (!response.text) {
      throw new Error('No response text received from AI');
    }

    console.log(`Response received, length: ${response.text.length} characters`);
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
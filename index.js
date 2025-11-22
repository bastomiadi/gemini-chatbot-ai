import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import multer from 'multer';
import * as pdfModule from 'pdf-parse';
const pdf = pdfModule.default || pdfModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = process.env.GEMINI_MODEL;

const upload = multer({ storage: multer.memoryStorage(), limits: { fieldSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

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
      if (file.mimetype === 'application/pdf') {
        const data = await pdf(file.buffer);
        content = data.text;
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
      // Append to last user message
      const lastMsg = conv[conv.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.text += `\n--- File: ${file.originalname} ---\n${content}`;
      }
    }

    const contents = conv.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
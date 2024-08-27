const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const Groq = require('groq-sdk');
const cors = require('cors');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const port = 5000;

app.use(cors());

// Configure storage for multer
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const upload = multer({ storage });

// Initialize Groq client with hardcoded API key
const groq = new Groq({ apiKey: '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' });

// Function to extract text from images using Tesseract
function extractTextFromImage(imagePath) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(
      imagePath,
      'eng', // Specify the language here
      {
        logger: info => console.log(info), // Optional logger for progress updates
      }
    ).then(({ data: { text } }) => {
      resolve(text);
    }).catch(err => {
      reject(err);
    });
  });
}

// Function to classify document using Groq
async function classifyDocument(extractedText) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Classify the document. The text is scanned using tesseract OCR. It may not be fully accurate but you just need to specify which type of document it is from this list otherwise return unknown [Marksheet, Aadhar Card, Pan Card, Character Certificate]',
        },
        {
          role: 'user',
          content: extractedText,
        }
      ],
      model: 'llama3-8b-8192',
    });
    
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Error classifying document:', error);
    throw error;
  }
}

// Handle file uploads and processing
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // Check for valid image file extensions
    if (!['.png', '.jpg', '.jpeg'].includes(path.extname(filePath).toLowerCase())) {
      return res.status(400).send('Unsupported file format. Please use PNG, JPG, or JPEG.');
    }

    // Extract text from image
    const extractedText = await extractTextFromImage(filePath);
    console.log('Extracted Text:', extractedText);

    // Classify the document
    const classification = await classifyDocument(extractedText);

    // Send the classification result
    res.status(200).json({ extractedText, classification });

    // Clean up uploaded file
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

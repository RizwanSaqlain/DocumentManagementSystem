const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const Groq = require('groq-sdk');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const port = 5000;

// Configure storage for multer
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Initialize Groq client with hardcoded API key
const groq = new Groq({ apiKey: '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' });

// Function to extract text from images using Tesseract
async function extractTextFromImage(imagePath) {
  try {
    const image = await loadImage(imagePath);

    // Ensure the image is large enough
    if (image.width < 100 || image.height < 100) {
      console.warn('Image is too small for OCR processing. Skipping OCR.');
      return 'Image too small for OCR processing.';
    }

    // Create a canvas to process the image
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    // Use Tesseract to extract text
    const { data: { text } } = await Tesseract.recognize(canvas.toBuffer(), 'eng');
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
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
    
    // Classify the document
    const classification = await classifyDocument(extractedText);

    // Send the classification result
    res.status(200).json({ classification });

    // Clean up uploaded file
    fs.unlinkSync(filePath);
  } catch (error) {
    res.status(500).send('Error processing file');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const Groq = require('groq-sdk');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const { createCanvas, loadImage } = require('canvas');
const { exec } = require('child_process'); // To run command-line tools


const app = express();
const port = 5000;

app.use(cors());


// Create an absolute path for the uploads directory
const uploadsDir = path.resolve(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Initialize Groq client with hardcoded API key
const groq = new Groq({ apiKey: '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' });


// Function to convert PDF to image using pdf-poppler (or another tool)
function convertPdfToImage(pdfPath, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `pdftoppm -png -singlefile -r 300 "${pdfPath}" "${outputPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(`Error converting PDF to image: ${stderr}`);
      }
      resolve(`${outputPath}.png`);
    });
  });
}


// Function to extract text from PDFs
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  let extractedText = data.text.trim();

  if (!extractedText) {
    console.log('No text found, converting PDF to image...');
    
    // Convert PDF to image
    const outputPath = path.join(__dirname, 'uploads', 'pdf_image_output');
    const imagePath = await convertPdfToImage(filePath, outputPath);

    // Extract text from the image
    extractedText = await extractTextFromImage(imagePath);

    // Clean up generated image file after processing
    fs.unlinkSync(imagePath);
  }

  return extractedText;
}


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
          "role": "system",
          "content": "You are an AI document classification assistant. You will receive text extracted from a document using OCR (Optical Character Recognition). The text may contain errors or incomplete information due to the nature of OCR. Your task is to determine the most likely type of document from the following categories: [Marksheet, Aadhar Card, Pan Card, Character Certificate]. If the text does not strongly match any of these categories, respond with 'Unknown'. Provide a clear and concise classification based on the content provided."
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
    const filePath = path.resolve(__dirname, '../uploads', req.file.filename);
    const fileExtension = path.extname(filePath).toLowerCase();

    let extractedText = '';

    if (['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
      // Handle image files
      extractedText = await extractTextFromImage(filePath);
    } else if (fileExtension === '.pdf') {
      // Handle PDF files
      extractedText = await extractTextFromPDF(filePath);
    } else {
      return res.status(400).send('Unsupported file format. Please use PNG, JPG, JPEG, or PDF.');
    }

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

from PIL import Image
import pytesseract
import pdfplumber
import os
from groq import Groq
from pdf2image import convert_from_path
from icecream import ic

GROQ_API_KEY='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'
client = Groq(api_key=GROQ_API_KEY)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Function to extract text from images using OCR
def extract_text_from_image(image_path):
    return pytesseract.image_to_string(Image.open(image_path))

# Function to extract text from PDFs
def extract_text_from_pdf(pdf_path):
    images = convert_from_path(pdf_path)
    text = ""
    for image in images:
        text += pytesseract.image_to_string(image) + "\n"
    return text

# Function to classify document using LLaMA
def classify_document(extracted_text):
    messages = [
        {
            "role": "system",
            "content": "Classify the document. The text is scanned using tesseract OCR. It may not be fully accurate but you just need to specify which type of document it is from this list otherwise return unknown [Marksheet, Aadhar Card, Pan Card, Character Certificate]"
        },
    #     *reference_samples,
        {
            "role": "user",
            "content": extracted_text
        }
    ]
    
    chat_completion = client.chat.completions.create(
        messages=messages,
        model="llama3-8b-8192",
    )
    
    return chat_completion.choices[0].message.content

# Function to handle both images and PDFs
def process_document(file_path):
    if file_path.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(file_path)
        ic(extracted_text)
    elif file_path.lower().endswith((".png", ".jpg", ".jpeg")):
        extracted_text = extract_text_from_image(file_path)
        ic(extracted_text)
    else:
        raise ValueError("Unsupported file format. Please use PDF, PNG, or JPEG.")

    # Example Reference Samples
    reference_samples = [
        {"role": "system", "content": "This text is from a passport document."},
        {"role": "system", "content": "This text is from a utility bill."},
    ]
    
    # Classify the document
    classification = classify_document(extracted_text)
    return classification

# Example usage
file_path = "Class X Digilocker Verified Copy.pdf"  # Change to your file path
result = process_document(file_path)
ic(result)
# print(result)

import requests
import io
import PyPDF2
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
from dotenv import load_dotenv
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Configure the Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def extract_text_from_pdf(pdf_url):
    try:
        response = requests.get(pdf_url)
        response.raise_for_status()
        pdf_file = io.BytesIO(response.content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        return None

def analyze_resume(pdf_url):
    resume_text = extract_text_from_pdf(pdf_url)
    if not resume_text:
        return json.dumps({"error": "Unable to extract text from the provided PDF."})

    prompt = f"""
    Analyze the following resume and provide a detailed assessment:

    {resume_text}

    Please provide an analysis that includes:
    1. Overall impression
    2. Strengths of the resume (pros)
    3. Areas for improvement (cons)
    4. Suggestions for enhancing the resume

    Format your response as follows:
    OVERALL IMPRESSION:
    [Your overall impression here]

    PROS:
    - [Strength 1]
    - [Strength 2]
    - [Strength 3]

    CONS:
    - [Area for improvement 1]
    - [Area for improvement 2]
    - [Area for improvement 3]

    SUGGESTIONS:
    - [Suggestion 1]
    - [Suggestion 2]
    - [Suggestion 3]

    Ensure that each section is clearly separated and follows this exact format.
    """

    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.7,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 2048,
        },
        safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        },
    )

    # Parse the response and format it as JSON
    try:
        sections = response.text.split('\n\n')
        analysis = {
            "overall_impression": sections[0].replace("OVERALL IMPRESSION:\n", "").strip(),
            "pros": [item.strip('- ') for item in sections[1].replace("PROS:\n", "").split('\n') if item.strip()],
            "cons": [item.strip('- ') for item in sections[2].replace("CONS:\n", "").split('\n') if item.strip()],
            "suggestions": [item.strip('- ') for item in sections[3].replace("SUGGESTIONS:\n", "").split('\n') if item.strip()]
        }
        return json.dumps(analysis)
    except Exception as e:
        print(f"Error parsing AI response: {str(e)}")
        return json.dumps({"error": "Failed to parse the analysis. Please try again."})
    


def convert_to_latex(pdf_url):
    resume_text = extract_text_from_pdf(pdf_url)
    if not resume_text:
        return "Error: Unable to extract text from the provided PDF."

    prompt = f"""
    Convert the following resume content into a LaTeX format:

    {resume_text}

    Please use a professional LaTeX resume template and structure the content appropriately.
    Include necessary LaTeX packages and commands.
    """

    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.3,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 4096,
        },
        safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        },
    )

    return response.text

def export_to_pdf(content):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    flowables = []

    # Parse the content and create PDF elements
    lines = content.split('\n')
    for line in lines:
        if line.startswith('\\section'):
            # Create a section title
            title = line.replace('\\section{', '').replace('}', '')
            flowables.append(Paragraph(title, styles['Heading1']))
        elif line.startswith('\\subsection'):
            # Create a subsection title
            title = line.replace('\\subsection{', '').replace('}', '')
            flowables.append(Paragraph(title, styles['Heading2']))
        elif line.strip().startswith('\\item'):
            # Create a bullet point
            text = line.replace('\\item', '').strip()
            flowables.append(Paragraph(f"• {text}", styles['BodyText']))
        elif line.strip():
            # Create a normal paragraph
            flowables.append(Paragraph(line, styles['BodyText']))
        
        flowables.append(Spacer(1, 0.2*inch))

    doc.build(flowables)
    buffer.seek(0)
    return buffer
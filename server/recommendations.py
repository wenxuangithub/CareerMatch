import requests
import PyPDF2
import io
import json
import logging
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
from dotenv import load_dotenv

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
        
        logger.debug(f"Extracted PDF text (first 1000 chars): {text[:1000]}")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return f"Error extracting PDF text: {str(e)}"

def get_job_recommendations(pdf_url, jobs):
    try:
        resume_text = extract_text_from_pdf(pdf_url)
        
        prompt = f"""
        Given the following resume and job listings, recommend the top 3 most suitable jobs for the candidate. 
        Analyze the resume and compare it with the job listings to find the best matches.
        
        Resume:
        {resume_text}

        Job Listings:
        {json.dumps(jobs, indent=2)}

        Provide your recommendations as a JSON array of job objects. Each job object should include the following fields: 
        companyName, role, descriptions, location, tags, and a field called 'matchReason' explaining why this job is a good match for the candidate.

        Return only the JSON array, without any additional text or explanation.
        """

        logger.debug(f"Generated prompt: {prompt}")

        # Call Gemini API
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
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

        # Parse the JSON response
        recommendations = json.loads(response.text)
        logger.debug(f"Gemini API response: {recommendations}")

        return recommendations
    except Exception as e:
        logger.error(f"Error in get_job_recommendations: {str(e)}")
        return f"Error generating recommendations: {str(e)}"
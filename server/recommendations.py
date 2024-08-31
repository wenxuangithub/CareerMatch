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
        Given the following resume and job listings, analyze all job listings and provide a suitability assessment for each job.
        
        Resume:
        {resume_text}

        Job Listings:
        {json.dumps(jobs, indent=2)}

        For each job, provide an assessment as a JSON object with the following fields:
        - companyName: The name of the company
        - role: The job title
        - tags: An array of relevant skills or keywords
        - matchReason: A detailed explanation of why this job is or isn't a good match for the candidate
        - matchScore: A string representing the match quality: "Excellent" (for top matches), "Average" (for decent matches), or "Poor" (for less suitable matches)
        - detailedAnalysis: A more in-depth analysis of the candidate's fit for the role, including strengths and potential areas for improvement

        Return a JSON array containing an assessment for each job listing, without any additional text or explanation.
        """

        logger.debug(f"Generated prompt: {prompt}")

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": 8192,  # Increased to handle more job listings
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
        )

        recommendations = json.loads(response.text)
        logger.debug(f"Gemini API response: {recommendations}")

        return recommendations
    except Exception as e:
        logger.error(f"Error in get_job_recommendations: {str(e)}")
        return f"Error generating recommendations: {str(e)}"
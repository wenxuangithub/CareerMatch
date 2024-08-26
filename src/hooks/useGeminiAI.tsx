import { useState} from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import {Alert} from 'react-native';

// Replace 'YOUR_API_KEY' with your actual Gemini API key
const genAI = new GoogleGenerativeAI('fw');

type Job = {
  classification: string;
  descriptions: string;
  location: string;
  role: string;
  tags: string[];
  time: string;
};

export const useGeminiAI = () => {
  const [recommendation, setRecommendation] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPDF = async (pdfUrl: string): Promise<string> => {
    try {
      const { uri } = await FileSystem.downloadAsync(
        pdfUrl,
        FileSystem.documentDirectory + 'resume.pdf'
      );

      const pdfContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // This is a very basic text extraction.
      // It won't work perfectly for all PDFs, but it's a simple approach that works in Expo.
      const decodedContent = atob(pdfContent);
      const extractedText = decodedContent.replace(/[^\x20-\x7E]/g, '');

      console.log(extractedText);
      return extractedText;
      
      
      
    } catch (err) {
      console.error('Error extracting text from PDF:', err);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const getRecommendation = async (pdfUrl: string, jobs: Job[]) => {
    setLoading(true);
    setError(null);

    try {
      const resumeText = await extractTextFromPDF(pdfUrl);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

      const prompt = `
        Given the following resume and job listings, recommend the top 3 most suitable jobs for the candidate. 
        Provide your recommendations in a JSON format with the job details.

        Resume:
        ${resumeText}

        Job Listings:
        ${JSON.stringify(jobs, null, 2)}

        Please analyze the resume and job listings, and return your recommendations as a JSON array of job objects.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const recommendedJobs = JSON.parse(text);
      setRecommendation(recommendedJobs);
    } catch (err) {
      setError('An error occurred while getting job recommendations. Please try again.');
      console.error('Gemini API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { recommendation, loading, error, getRecommendation };
};
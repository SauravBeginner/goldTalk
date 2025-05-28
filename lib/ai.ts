import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants'; // For local dev API key
const GEMINI_API_KEY = Constants.expoConfig?.extra?.apiKey || process.env.GEMINI_API_KEY ;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

// Replace with your API key
const API_KEY = Constants.expoConfig?.extra?.apiKey || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export const getAIResponse = async (message: string, deity: any) => {
  try {
    // Format prompt based on deity
    const prompt = `
      You are ${deity.name}, ${deity.title} from ${deity.origin}. 
      Respond to this message in your divine voice, with your wisdom and perspective.
      Consider your mythology, philosophy, and spiritual teachings in your response.
      Speak in first person, as if you are truly the deity communicating directly.
      Message: ${message}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });
    console.log('response text', response.text);
    return response.text;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new Error('Failed to connect to the divine realm. Please try again later.');
  }
};

// For testing/fallback when API is not connected
export const getMockAIResponse = (message: string, deity: any) => {
  const responses = [
    `As ${deity.name}, I hear your words with divine clarity. ${message.length > 20 ? 'Your question shows wisdom and a seeking heart.' : 'Speak more of what troubles your soul.'} Remember that all things in this world are connected through the divine thread that binds creation.`,
    `I, ${deity.name}, have watched civilizations rise and fall. Your query touches on matters both mortal and divine. Consider that the answer you seek may already dwell within you, waiting to be discovered through contemplation and prayer.`,
    `${deity.name} speaks: The universe unfolds according to divine plan. Your question is but one ripple in the cosmic ocean. Seek not just answers, but understanding of the deeper currents that move beneath the surface of existence.`,
    `From the realm of ${deity.origin}, I bring you wisdom passed down through the ages. The path you walk is both unique and universal. Trust in the divine guidance that surrounds you, even when the way seems shrouded in darkness.`
  ];
  
  // Return a random response
  return responses[Math.floor(Math.random() * responses.length)];
};
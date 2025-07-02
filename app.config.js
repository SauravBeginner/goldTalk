// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        // apiKey: process.env.GEMINI_API_KEY, // Loads from .env during build process
        EXPO_PUBLIC_GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY, // Use the correct environment variable name
        EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY, // Keep this line for Speech-to-Text API key
        // eas: {
        //   projectId: "your-eas-project-id" // If you use EAS Build
        // }
      },
        // plugins: [
        //   "expo-audio", {
        //     "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone."
        //   }
        // ]
    };
  };
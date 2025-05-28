// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        apiKey: process.env.GEMINI_API_KEY, // Loads from .env during build process
        // eas: {
        //   projectId: "your-eas-project-id" // If you use EAS Build
        // }
      },
    };
  };
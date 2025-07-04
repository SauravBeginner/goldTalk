import Regenerate from "@/assets/svgs/regenerate";
import Reload from "@/assets/svgs/reload";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech"; // Ensure useLocalSearchParams is imported here
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { scale, verticalScale } from "react-native-size-matters";

export default function HomeScreen() {
  // Initialize the GoogleGenerativeAI with your API key outside of the component
  const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_API_KEY as string);

  const router = useRouter();
  // Access deity parameters from router.params
  const { deityName, deityTitle, deityOrigin } = useLocalSearchParams() as {
    deityName: string;
    deityTitle: string;
    deityOrigin: string;
  };
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording>();
  const [AIResponse, setAIResponse] = useState(false);
  const [AISpeaking, setAISpeaking] = useState(false);
  const lottieRef = useRef<LottieView>(null);

  const getMicrophonePermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission", "Please grant permission to access microphone");
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const recordingOptions: any = {
    android: {
      extension: ".amr",
      // outputFormat: Audio.AndroidOutputFormat.AMR_WB,
      // audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: ".wav",
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  };

  const startRecording = async () => {
    const hasPermission = await getMicrophonePermission();
    if (!hasPermission) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
    } catch (error) {
      console.error("Failed to start Recording", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setLoading(true);
      await recording?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      // **Add this line to reset the recording state:**
      setRecording(undefined); // Or setRecording(null); depending on your preference

      const uri = recording?.getURI();
      if (!uri) {
        Alert.alert("Error", "Could not retrieve recording.");
        setLoading(false);
        return;
      }

      const transcript = await sendAudioToGoogleSTT(uri);
      setText(transcript);

      console.warn('transcript:', transcript);

      if (transcript && transcript.trim().length > 0 && transcript !== "No speech recognized.") {
        await sendToGemini(transcript);
      } else {
        setLoading(false);
        Alert.alert("No Speech Detected", "Couldn't hear anything. Please try again.");
      }
    } catch (error) {
      console.error("Failed to stop Recording", error);
      Alert.alert("Error", "Failed to stop recording");
      setLoading(false);
    }
  };

  const uriToBase64 = async (uri: string) => {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  };

  const sendAudioToGoogleSTT = async (uri: string) => {
    try {
      const base64Audio = await uriToBase64(uri);

      const response = await axios.post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY}`,
        {
          config: {
            encoding: "LINEAR16",
            sampleRateHertz: 16000,
            languageCode: "en-US",
          },
          audio: {
            content: base64Audio,
          },
        }
      );

      const transcript = response.data.results
        ?.map((result: any) => result.alternatives[0].transcript)
        .join(" ");

      return transcript || "No speech recognized.";
    } catch (error) {
      console.error("Google STT error:", error);
      Alert.alert("Transcription Error", "Failed to transcribe audio.");
      return "";
    }
  };

  const sendToGemini = async (text: string) => {
    console.warn('text:', text);
    try {
      // Construct deity context using parameters
      const deityContext = `You are ${deityName}, ${deityTitle}, from the realm of ${deityOrigin}. Respond in a manner befitting your divine nature and origin. Use language and tone appropriate for a deity.`;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", systemInstruction: deityContext });
      const result = await model.generateContent(text);
      const response = await result.response;
      const reply = response.text();

      setText(reply);
      setLoading(false);
      setAIResponse(true);
      await speakText(reply);
      return reply;
    } catch (error) {
      console.error("Error sending text to Gemini:", error);
      Alert.alert("AI Error", "Failed to get response from Gemini.");
      setLoading(false);
    }
  };

  const speakText = async (text: string) => {
    setAISpeaking(true);
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.5,
      rate: 1,
      onDone: () => setAISpeaking(false),
    });
  };

  useEffect(() => {
    if (AISpeaking) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.reset();
    }
  }, [AISpeaking]);

  return (
    <LinearGradient
      colors={["#250152", "#000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle={"light-content"} />

      {/* Back Navigation Button */}
      {!AIResponse ? (<TouchableOpacity
        style={{
          position: "absolute",
          top: verticalScale(50),
          left: scale(20),
          zIndex: 10,
        }}
        onPress={() => {
          // Stop speech playback
          Speech.stop();
          setAIResponse(false);
          setText("");
          setIsRecording(false); // Make sure recording state is also reset if needed
          setLoading(false); // Reset loading state
          setRecording(undefined); // Reset recording object
          router.back();
        }}
      >
        <AntDesign name="arrowleft" size={scale(24)} color="#fff" />
      </TouchableOpacity>)
        : (
          <TouchableOpacity
            style={{
              position: "absolute",
              top: verticalScale(50),
              left: scale(20),
              zIndex: 10, // Add zIndex here as well
            }}
            onPress={() => {
              Speech.stop();
              setIsRecording(false);
              setAIResponse(false);
              setText("");
            }}
          >
            <AntDesign name="arrowleft" size={scale(20)} color="#fff" />
          </TouchableOpacity>
        )}
      <Image
        source={require("@/assets/main/blur.png")}
        style={{
          position: "absolute",
          right: scale(-15),
          top: 0,
          width: scale(240),
        }}
      />
      <Image
        source={require("@/assets/main/purple-blur.png")}
        style={{
          position: "absolute",
          left: scale(-15),
          bottom: verticalScale(100),
          width: scale(210),
        }}
      />

      <View style={{ marginTop: verticalScale(-40) }}>
        {loading ? (
          <TouchableOpacity>
            <LottieView
              source={require("@/assets/animations/loading.json")}
              autoPlay
              loop
              speed={1.3}
              style={{ width: scale(270), height: scale(270) }}
            />
          </TouchableOpacity>
        ) : !isRecording ? (
          AIResponse ? (
            <View>
              <LottieView
                ref={lottieRef}
                source={require("@/assets/animations/ai-speaking.json")}
                autoPlay={false}
                loop
                style={{ width: scale(250), height: scale(250) }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={{
                width: scale(110),
                height: scale(110),
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: scale(100),
              }}
              onPress={startRecording}
            >
              <FontAwesome
                name="microphone"
                size={scale(50)}
                color="#2b3356"
              />
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity onPress={stopRecording}>
            <LottieView
              source={require("@/assets/animations/animation.json")}
              autoPlay
              loop
              speed={1.3}
              style={{ width: scale(250), height: scale(250) }}
            />
          </TouchableOpacity>
        )}
      </View>

      <View
        style={{
          alignItems: "center",
          width: scale(350),
          position: "absolute",
          bottom: verticalScale(90),
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: scale(16),
            width: scale(269),
            textAlign: "center",
            lineHeight: 25,
          }}
        >
          {loading ? "..." : text || "Press the microphone to start recording!"}
        </Text>
      </View>

      {AIResponse && (
        <View
          style={{
            position: "absolute",
            bottom: verticalScale(40),
            left: 0,
            paddingHorizontal: scale(30),
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: scale(360),
          }}
        >
          <TouchableOpacity onPress={() => sendToGemini(text)}>
            <Regenerate />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => speakText(text)}>
            <Reload />
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131313",
  },
});

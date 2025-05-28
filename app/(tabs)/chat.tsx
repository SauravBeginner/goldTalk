import { deities } from '@/data/deities';
import { getAIResponse } from '@/lib/ai';
import { saveConversation } from '@/lib/firebase';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS, } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { speak } from 'expo-speech';
import { ArrowLeft, Mic, MicOff, Pause, Play, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';

// Suggested code may be subject to a license. Learn more: ~LicenseLog:2510578202.
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const deityId = params.deity as string;
  const [selectedDeity, setSelectedDeity] = useState(deities[0]);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{text: string, sender: string, timestamp: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {

    const initalized = async ()=>{
      if (deityId) {
        const deity = deities.find(d => d.id === deityId);
        if (deity) {
          setSelectedDeity(deity);
          
          // Add greeting message from deity
          const greeting = {
            text: deity.greeting,
            sender: 'deity',
            timestamp: Date.now()
          };
          setConversation([greeting]);
          // console.log('Attempting to speak greeting:', deity.greeting);
          // try {
          //   await Audio.setAudioModeAsync({
          //     allowsRecordingIOS: false,
          //     interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          //     playsInSilentModeIOS: true,
          //     shouldDuckAndroid: true,
          //     interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          //     playThroughEarpieceAndroid: false,
          //   });
  
          //   // speak(deity.greeting);
          // } catch (err) {
          //   console.error('Audio config or speech failed:', err);
          // }
        }
      }
    }
    initalized();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [deityId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      text: message,
      sender: 'user',
      timestamp: Date.now()
    };

    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await getAIResponse(message, selectedDeity);
      
      const deityMessage = {
        text: response,
        sender: 'deity',
        timestamp: Date.now()
      };
    //@ts-ignore
      setConversation(prev => [...prev, deityMessage]);
      
      // Save conversation to Firebase
      await saveConversation(selectedDeity.id, userMessage, deityMessage);

      // Create and store audio response
      const { sound: audioResponse } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${response}` }
      );
      setSound(audioResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        text: "I'm sorry, I couldn't connect to the divine realm at this moment. Please try again later.",
        sender: 'deity',
        timestamp: Date.now()
      };
      
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      // Here we would normally send the audio to a speech-to-text service
      // For now, we'll simulate it with a placeholder message
      setMessage('Voice message transcription would appear here');
    }
  };

  const togglePlayback = async (msg: {text:string,sender:string}, index:number) => {
    // The messageIndex is currently unused. You can use it later to play specific messages.
  
   try {
     if (isPlaying && sound) {
       await sound.pauseAsync();
       setIsPlaying(false);
     } else if (sound) {
       await sound.playAsync();
       setIsPlaying(true); // This was false before, likely a mistake
      //  await sound.unloadAsync();
      //  setIsPlaying(false);
     }
    } catch (error) {
      console.error(`Playback error at message ${index}:`, error);
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
    speak(msg.text, {
      onDone: () => setIsPlaying(false),
      onPause: () => setIsPlaying(false),
      onStart: () => setIsPlaying(true),
    });
  };  

  return (
    <LinearGradient
      colors={[selectedDeity.color + '80', '#16213e', '#0f0f1f']}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.deityInfo}>
          <Image 
            source={{ uri: selectedDeity.imageUrl }} 
            style={styles.deityAvatar} 
          />
          <View>
            <Text style={styles.deityName}>{selectedDeity.name}</Text>
            <Text style={styles.deityTitle}>{selectedDeity.title}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef} 
        style={styles.conversationContainer}
        contentContainerStyle={styles.conversationContent}
      >
        {conversation.map((msg, index) => (
          <View 
            key={index} 
            style={[
              styles.messageBubble, 
              msg.sender === 'user' ? styles.userBubble : styles.deityBubble
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
            {msg.sender === 'deity' && (
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={() => togglePlayback(msg, index)}
              >
                {isPlaying ? (
                  <Pause size={16} color="#fff" />
                ) : (
                  <Play size={16} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={selectedDeity.color} />
            <Text style={styles.loadingText}>{selectedDeity.name} is contemplating...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
        style={[styles.inputContainer, { paddingBottom: insets.bottom + 70 }]}
      >
        <TextInput
          style={styles.input}
          placeholder="Ask your question..."
          placeholderTextColor="#a9a9a9"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        
        <TouchableOpacity
          style={[styles.iconButton, isRecording && styles.recordingButton]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          {isRecording ? (
            <MicOff size={20} color="#fff" />
          ) : (
            <Mic size={20} color="#fff" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: selectedDeity.color }]}
          onPress={handleSendMessage}
          disabled={!message.trim() || isLoading}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  deityName: {
    fontFamily: 'Playfair-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  deityTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#e0e0e0',
  },
  conversationContainer: {
    flex: 1,
  },
  conversationContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  deityBubble: {
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#ffffff',
  },
  playButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#e0e0e0',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    color: '#ffffff',
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
  },
  iconButton: {
    backgroundColor: '#555',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  recordingButton: {
    backgroundColor: '#ff4d4d',
  },
});
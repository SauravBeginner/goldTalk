import { initializeApp } from 'firebase/app';
import { addDoc, collection, getDocs, getFirestore, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'; // Import Storage modules

// Firebase configuration - replace with your own config
const firebaseConfig = {
  apiKey: 'AIzaSyBz_4mK6y1Q2EaTiY_j1_Z5u6KZmaj6P-4', // Ensure this is your actual API key
  authDomain: 'godtalk-f0885.firebaseapp.com',
  projectId: 'godtalk-f0885',
  storageBucket: 'godtalk-f0885.appspot.com',
  messagingSenderId: '199070515916',
  appId: '1:199070515916:web:f2b86ce68412f90083b869',
  measurementId: 'G-307KYMCN4T', // This can remain; it doesn't hurt if Analytics isn't initialized
};

let app: any = null;
let storage: any = null; // Add storage variable

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    initializeFirebase(); // Ensure app and storage are initialized
  }
  return storage;
}
// Save conversation to Firestore
export const saveConversation = async (
  deityId: string,
  userMessage: any,
  deityMessage: any
) => {
  try {
    const db = getFirestore();
    const conversationsRef = collection(db, 'conversations');
    
    const docRef = await addDoc(conversationsRef, {
      deityId,
      userMessage,
      deityMessage,
      timestamp: Date.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
};

// Get conversation history
export const getConversationHistory = async (userId : string) => {
  try {
    const db = getFirestore();
    const conversationsRef = collection(db, 'conversations');
    
    const q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations: any[] = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return conversations;
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
};

// Add the uploadAudio function
export const uploadAudio = async (uri: string, filename: string) => {
  try {
    const storage = getFirebaseStorage(); // Get initialized storage
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `audio/${filename}`); // 'audio' is a folder in your storage
    const uploadTask = uploadBytes(storageRef, blob);

    await uploadTask; // Wait for the upload to complete
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
}
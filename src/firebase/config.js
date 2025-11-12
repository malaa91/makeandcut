import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "ton-api-key",
  authDomain: "makeandcut.firebaseapp.com",
  projectId: "makeandcut",
  storageBucket: "makeandcut.appspot.com",
  messagingSenderId: "123456789",
  appId: "ton-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
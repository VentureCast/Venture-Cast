import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDZApLf6J_YINmJfBFAzSNRfc6P22wGqc",
  authDomain: "venture-cast.firebaseapp.com",
  projectId: "venture-cast",
  storageBucket: "venture-cast.firebasestorage.app",
  messagingSenderId: "794174248022",
  appId: "1:794174248022:ios:8920c87395d958fd5b57f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);  // `auth` is exported
export const db = getFirestore(app);  //  `db` is exported
export default app;

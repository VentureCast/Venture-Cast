import { auth } from "./firebase.js";  //  This is the test function run firebaseAuthTest.js
import { signInAnonymously } from "firebase/auth";

const testAuth = async () => {
  try {
    console.log("Attempting anonymous sign-in...");
    const userCredential = await signInAnonymously(auth);
    console.log("Auth successful! User:", userCredential.user);
  } catch (error) {
    console.error("Authentication failed:", error);
  }
};

testAuth();

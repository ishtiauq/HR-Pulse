import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const handleGoogleLogin = async () => {
  try {
    // ১. Google authentication পপ-আপ খোলা
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // ২. Firestore থেকে ইউজার ডকুমেন্ট রিড করা
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // ৩. ডকুমেন্ট না থাকলে নতুন ইউজার তৈরি করা
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      });
    }

    console.log("Login successful:", user);
  } catch (error) {
    console.error("Login Error:", error.code, error.message);
  }
};

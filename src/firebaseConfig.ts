
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCU0WPTyqBGvgTZkIoplVUPfee4Zxaln44",
    authDomain: "ac62-a682c.firebaseapp.com",
    databaseURL: "https://ac62-a682c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ac62-a682c",
    storageBucket: "ac62-a682c.firebasestorage.app",
    messagingSenderId: "574850486529",
    appId: "1:574850486529:web:dffd5d25e74d2501d58b00"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // 👈 MANA SHU QATOR TO'G'RI BO'LISHI KERAK!


const firebaseConfig = {
  apiKey: "AIzaSyBRYjX3MwHil6wYh7DXqwqPZObWzRY5vQA",
  authDomain: "cafe-chocoberry.firebaseapp.com",
  databaseURL: "https://cafe-chocoberry-default-rtdb.firebaseio.com",
  projectId: "cafe-chocoberry",
  storageBucket: "cafe-chocoberry.firebasestorage.app",
  messagingSenderId: "288421699835",
  appId: "1:288421699835:web:e93aa10155d19a6df9d05e",
  measurementId: "G-9C27P5ER88"
};



const app = initializeApp(firebaseConfig);

// Endi bu yerda xato bermaydi:
export const db = getDatabase(app);
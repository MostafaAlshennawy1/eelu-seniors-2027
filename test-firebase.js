import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAueJ4eTKLS6qrWd2284IolMjJpTYEuYPg",
  authDomain: "eelu-seniors.firebaseapp.com",
  projectId: "eelu-seniors",
  storageBucket: "eelu-seniors.firebasestorage.app",
  messagingSenderId: "142710977399",
  appId: "1:142710977399:web:91cd6c4c4c50d889e0e772"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log("Fetching uploads...");
  try {
    const querySnapshot = await getDocs(collection(db, "uploads"));
    const allDocs = [];
    querySnapshot.forEach((doc) => {
      allDocs.push(doc.data());
    });
    console.log("Total uploads:", allDocs.length);
    console.log("All docs:", JSON.stringify(allDocs, null, 2));

    const q = query(collection(db, "uploads"), where("type", "==", "Memories Gallery"));
    const markedSnapshot = await getDocs(q);
    console.log("Marked uploads:", markedSnapshot.size);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1eGW8Kmn0nGFDlDQUyQjKmYqgBNDKXkI",
    authDomain: "dineflow-fndvc.firebaseapp.com",
    databaseURL: "https://dineflow-fndvc-default-rtdb.firebaseio.com",
    projectId: "dineflow-fndvc",
    storageBucket: "dineflow-fndvc.firebasestorage.app",
    messagingSenderId: "1079219468548",
    appId: "1:1079219468548:web:7c5e186b514f05eb94f851",
    measurementId: "G-5JNWSHBZ4H"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

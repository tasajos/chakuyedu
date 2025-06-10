import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA7rh2rQVyD_hdLtUlwq9XynMFG0sOpVlA",
  authDomain: "chakuyedus.firebaseapp.com",
  projectId: "chakuyedus",
  storageBucket: "chakuyedus.firebasestorage.app",
  messagingSenderId: "969279905577",
  appId: "1:969279905577:web:e9635545d36169777ae138"
};

// Inicializar
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Auth helpers
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

// Firestore helpers
export const usuariosCol  = collection(db, 'usuarios');
export const materiasCol  = collection(db, 'materias');
export const inscCol      = collection(db, 'estudiante_materia');
export const dmCol        = collection(db, 'docente_materia');
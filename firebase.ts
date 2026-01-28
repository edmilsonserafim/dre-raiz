
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Para configurar o Firebase, siga as instruções em INSTRUCOES-FIREBASE.md
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_API_KEY || "CONFIGURE-FIREBASE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "projeto.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "projeto",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "projeto.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123:web:abc"
};

// Validação das credenciais
if (firebaseConfig.apiKey === "CONFIGURE-FIREBASE") {
  console.error("🔴 FIREBASE NÃO CONFIGURADO!");
  console.error("📖 Leia o arquivo INSTRUCOES-FIREBASE.md para configurar o login com Google");
  console.error("🔗 https://console.firebase.google.com");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut };

// Configuração opcional para facilitar o debug em caso de erro de configuração
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

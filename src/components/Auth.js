import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import '../styles/Auth.css';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Écouter les changements d'authentification
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  if (user) {
    return (
      <div className="auth-status">
        <p>👋 Bonjour, {user.email}</p>
        <button onClick={handleLogout} className="logout-btn">
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h3>{isLogin ? 'Connexion' : 'Inscription'}</h3>
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {isLogin ? 'Se connecter' : 'Créer un compte'}
        </button>
      </form>
      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="switch-auth"
      >
        {isLogin ? 'Créer un compte' : 'Déjà un compte ?'}
      </button>
    </div>
  );
}

export default Auth;
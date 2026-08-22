import { useState } from 'react';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div className="app-container">
      {currentUser ? (
        <div className="dashboard-preview-card">
          <div className="brand-badge">✈️ GlobeTrotter</div>
          <h2>Welcome, {currentUser.name || currentUser.email}!</h2>
          <p className="user-email">Signed in as: <strong>{currentUser.email}</strong></p>
          <div className="dashboard-message">
            <p>You have successfully logged in. Dashboard & Trips view will be connected here.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setCurrentUser(null)}
          >
            Log Out
          </button>
        </div>
      ) : (
        <Auth onLoginSuccess={(user) => setCurrentUser(user)} />
      )}
    </div>
  );
}

export default App;

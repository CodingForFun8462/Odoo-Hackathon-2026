import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">✈️</span>
          <span className="brand-title">GlobeTrotter</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/" className="nav-link active">Dashboard</Link>
          <Link to="/trips" className="nav-link">My Trips</Link>
        </nav>

        <div className="navbar-user">
          {currentUser && (
            <div className="user-profile-badge">
              <div className="user-avatar">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <span className="user-name">{currentUser.name}</span>
            </div>
          )}
          <button onClick={handleLogout} className="logout-btn" title="Log out">
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

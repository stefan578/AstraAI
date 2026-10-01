import React from 'react';
import { Link } from 'react-router-dom';

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <Link to="/" className="nav-item">
        <span>🏠</span>
        <span>Početna</span>
      </Link>
      <Link to="/chat" className="nav-item">
        <span>💬</span>
        <span>Chat</span>
      </Link>
      <Link to="/flashcards" className="nav-item">
        <span>🃏</span>
        <span>Flesh kartice</span>
      </Link>
      <Link to="/quiz" className="nav-item">
        <span>📝</span>
        <span>Kviz</span>
      </Link>
      <Link to="/settings" className="nav-item">
        <span>⚙️</span>
        <span>Podešavanja</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
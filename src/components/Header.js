import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUserCircle, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/images/logo.svg';

const Header = ({ activeTab, onTabChange }) => {
  return (
    <header className="header">
      <div className="logo-container">
        <Link 
          to="/" 
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
        >
          <img src={logo} alt="Kairos Logo" className="logo" />
          <h1 className="app-title">Kairos</h1>
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/" className="nav-link">
          <FontAwesomeIcon icon={faCalendarAlt} /> Calendar
        </Link>
        <Link to="/syllabusParser" className="nav-link">
          <FontAwesomeIcon icon={faFileAlt} /> Syllabus Parser
        </Link>
        <Link to="/account" className="nav-link account-link">
          <FontAwesomeIcon icon={faUserCircle} size="lg" />
          <span className="account-text">Account</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;

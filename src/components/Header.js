import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/images/logo.svg';

const Header = () => {
  return (
    <header className="header">
      <div className="logo-container">
        <img src={logo} alt="Kairos Logo" className="logo" />
        <h1 className="app-title">Kairos</h1>
      </div>
      <div>
        <FontAwesomeIcon icon={faCalendarAlt} /> Calendar
      </div>
    </header>
  );
};

export default Header;

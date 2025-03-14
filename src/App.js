import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Calendar from './components/Calendar';
import Account from './components/Account';
import './styles/App.css';
import './styles/Account.css';

function App() {
  return (
    <Router>
      <div className="app-container" data-testid="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Calendar data-testid="calendar-component"/>} />
            <Route path="/account" element={<Account />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

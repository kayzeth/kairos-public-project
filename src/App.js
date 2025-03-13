import React from 'react';
import Header from './components/Header';
import Calendar from './components/Calendar';
import './styles/App.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Calendar />
      </main>
    </div>
  );
}

export default App;

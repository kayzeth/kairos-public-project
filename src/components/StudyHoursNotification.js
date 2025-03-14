import React, { useState } from 'react';
import { format } from 'date-fns';
import '../styles/StudyHoursNotification.css';

const StudyHoursNotification = ({ exams, onSetHours, onDismiss }) => {
  const [studyHours, setStudyHours] = useState({});

  const handleHoursChange = (examId, value) => {
    const hours = value === '' ? '' : Math.max(1, parseInt(value) || 0);
    setStudyHours(prev => ({ ...prev, [examId]: hours }));
  };

  const handleSubmit = (examId) => {
    const hours = studyHours[examId];
    if (hours && hours > 0) {
      onSetHours(examId, hours);
    }
  };

  if (!exams || exams.length === 0) return null;

  return (
    <div className="study-hours-notification">
      <div className="notification-header">
        <h3>Study Hours Needed</h3>
        <p>Please set your study hours for upcoming exams</p>
      </div>
      <div className="exam-list">
        {exams.map(exam => (
          <div key={exam.id} className="exam-item">
            <div className="exam-info">
              <h4>{exam.title}</h4>
              <p>Date: {format(new Date(exam.start), 'MMM d, yyyy h:mm a')}</p>
            </div>
            <div className="exam-actions">
              <input
                type="number"
                min="1"
                placeholder="Hours"
                value={studyHours[exam.id] || ''}
                onChange={(e) => handleHoursChange(exam.id, e.target.value)}
                aria-label="Study hours"
              />
              <button 
                className="set-hours-btn"
                onClick={() => handleSubmit(exam.id)}
                disabled={!studyHours[exam.id] || studyHours[exam.id] < 1}
              >
                Set Hours
              </button>
              <button 
                className="remind-later-btn"
                onClick={() => onDismiss(exam.id)}
              >
                Later
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyHoursNotification;

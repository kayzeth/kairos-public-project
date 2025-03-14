import { addDays } from 'date-fns';

class NudgeManager {
  constructor() {
    // Load saved data from localStorage
    const savedData = localStorage.getItem('nudgeManager');
    const data = savedData ? JSON.parse(savedData) : { studyHours: {}, dismissedExams: {} };
    
    this.studyHours = new Map(Object.entries(data.studyHours));
    this.dismissedExams = new Map(
      Object.entries(data.dismissedExams).map(([key, value]) => [key, new Date(value)])
    );
  }

  // Save current state to localStorage
  _saveToStorage() {
    const data = {
      studyHours: Object.fromEntries(this.studyHours),
      dismissedExams: Object.fromEntries(
        Array.from(this.dismissedExams).map(([key, value]) => [key, value.toISOString()])
      )
    };
    localStorage.setItem('nudgeManager', JSON.stringify(data));
  }

  getExamsNeedingAttention(events, currentDate = new Date()) {
    return events.filter(event => {
      if (event.type !== 'exam') return false;
      
      // If study hours are already set (either in storage or event), don't show notification
      const storedHours = this.studyHours.get(event.id);
      const eventHours = event.studyHours;
      const hasValidHours = this._isValidStudyHours(storedHours) || this._isValidStudyHours(eventHours);
      if (hasValidHours) return false;
      
      // Check if exam is within next 2 weeks
      const examDate = new Date(event.start);
      const twoWeeksFromNow = addDays(currentDate, 14);
      if (examDate <= currentDate || examDate > twoWeeksFromNow) return false;

      return this.shouldShowNotification(event.id, currentDate);
    });
  }

  async analyzeUpcomingExams(events, currentDate = new Date()) {
    const twoWeeksFromNow = addDays(currentDate, 14);

    const upcomingExams = events.filter(event => {
      if (event.type !== 'exam') return false;
      
      const examDate = new Date(event.start);
      return examDate > currentDate && examDate <= twoWeeksFromNow;
    });

    return upcomingExams.map(exam => {
      const examDate = new Date(exam.start);
      const daysUntilExam = Math.ceil((examDate - currentDate) / (1000 * 60 * 60 * 24));
      const totalStudyHours = this.getStudyHours(exam.id) || exam.studyHours || 0;
      const recommendedDailyHours = Math.ceil(totalStudyHours / daysUntilExam);
      const needsAttention = recommendedDailyHours > 4;

      return {
        examId: exam.id,
        daysUntilExam,
        totalStudyHours,
        recommendedDailyHours,
        needsAttention,
        lastDismissed: this.dismissedExams.get(exam.id)
      };
    });
  }

  getStudyHours(examId) {
    const hours = this.studyHours.get(examId);
    return this._isValidStudyHours(hours) ? hours : 0;
  }

  setStudyHours(examId, hours) {
    // Validate and convert hours to a number
    const validHours = this._validateStudyHours(hours);
    if (validHours !== null) {
      this.studyHours.set(examId, validHours);
      this.dismissedExams.delete(examId); // Clear dismissed status when valid hours are set
    } else {
      // If hours are invalid, remove them so notification will show
      this.studyHours.delete(examId);
    }
    this._saveToStorage();
  }

  dismissExam(examId, dismissTime = new Date()) {
    this.dismissedExams.set(examId, dismissTime);
    this._saveToStorage();
  }

  shouldShowNotification(examId, currentDate = new Date()) {
    const lastDismissed = this.dismissedExams.get(examId);
    if (!lastDismissed) return true;

    const hoursSinceLastDismiss = Math.floor((currentDate.getTime() - lastDismissed.getTime()) / (1000 * 60 * 60));
    return hoursSinceLastDismiss >= 4; // Show again after 4 hours
  }

  // Private helper methods for validation
  _isValidStudyHours(hours) {
    return typeof hours === 'number' && !isNaN(hours) && hours > 0;
  }

  _validateStudyHours(hours) {
    // Handle string input from forms
    if (typeof hours === 'string') {
      hours = parseFloat(hours);
    }
    
    // Validate the number
    if (typeof hours === 'number' && !isNaN(hours) && hours > 0) {
      return hours;
    }
    
    return null;
  }
}

export default NudgeManager;

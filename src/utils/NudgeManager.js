import { addDays, differenceInDays, parseISO, isWithinInterval } from 'date-fns';

class NudgeManager {
  constructor() {
    // Default study hours per exam (can be customized per exam later)
    this.defaultStudyHours = 10;
    this.studyPlans = new Map(); // Map of examId -> studyHours
  }

  // Analyze upcoming exams within the next two weeks
  analyzeUpcomingExams(events, currentDate = new Date()) {
    const twoWeeksFromNow = addDays(currentDate, 14);
    
    // Filter for exam events in the next two weeks
    const upcomingExams = events.filter(event => {
      if (event.type !== 'exam') return false;
      
      const examDate = parseISO(event.start);
      return isWithinInterval(examDate, {
        start: currentDate,
        end: twoWeeksFromNow
      });
    });

    // Sort exams by date
    upcomingExams.sort((a, b) => parseISO(a.start) - parseISO(b.start));

    const analysisResult = upcomingExams.map(exam => {
      const examDate = parseISO(exam.start);
      const daysUntilExam = differenceInDays(examDate, currentDate);
      const studyHours = this.studyPlans.get(exam.id) || this.defaultStudyHours;
      
      // Calculate recommended daily study hours
      const recommendedDailyHours = Math.ceil(studyHours / daysUntilExam);
      
      return {
        examId: exam.id,
        examTitle: exam.title,
        daysUntilExam,
        totalStudyHours: studyHours,
        recommendedDailyHours,
        examDate: exam.start,
        needsAttention: daysUntilExam <= 7 && studyHours > (daysUntilExam * 2) // Flag if cramming might be needed
      };
    });

    console.log('Nudge Analysis Result:', analysisResult);
    return analysisResult;
  }

  // Set custom study hours for a specific exam
  setStudyHours(examId, hours) {
    this.studyPlans.set(examId, hours);
    console.log(`Updated study hours for exam ${examId}: ${hours} hours`);
  }

  // Get study hours for a specific exam
  getStudyHours(examId) {
    return this.studyPlans.get(examId) || this.defaultStudyHours;
  }
}

export default NudgeManager;

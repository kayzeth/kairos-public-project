import { addDays, differenceInDays, parseISO, isWithinInterval } from 'date-fns';

class NudgeManager {
  constructor() {
    this.defaultStudyHours = 10;
    this.studyPlans = new Map();
  }

  // Prompts user for study hours for each exam
  async promptForStudyHours(exams) {
    // Show a single initial prompt explaining what's about to happen
    const proceed = window.confirm(
      `You have ${exams.length} upcoming exam(s) that need study hour allocation. Would you like to set study hours now?`
    );

    if (!proceed) {
      console.log('Using default study hours for all exams');
      exams.forEach(exam => {
        this.setStudyHours(exam.id, this.defaultStudyHours);
      });
      return;
    }

    for (const exam of exams) {
      const answer = prompt(
        `${exam.title} (${new Date(exam.start).toLocaleDateString()})\n` +
        `How many hours would you like to study? (Default: ${this.defaultStudyHours})\n` +
        `Press Cancel to use default.`
      );
      
      if (answer === null) {
        console.log(`Using default of ${this.defaultStudyHours} hours for ${exam.title}`);
        this.setStudyHours(exam.id, this.defaultStudyHours);
        continue;
      }

      const hours = parseInt(answer, 10);
      if (!isNaN(hours) && hours > 0) {
        this.setStudyHours(exam.id, hours);
        console.log(`Set ${hours} study hours for ${exam.title}`);
      } else {
        console.log(`Invalid input. Using default of ${this.defaultStudyHours} hours for ${exam.title}`);
        this.setStudyHours(exam.id, this.defaultStudyHours);
      }
    }
  }

  // Analyze upcoming exams within the next two weeks
  async analyzeUpcomingExams(events, currentDate = new Date()) {
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

    // Prompt for study hours if not already set
    const examsNeedingHours = upcomingExams.filter(exam => !this.studyPlans.has(exam.id));
    if (examsNeedingHours.length > 0) {
      await this.promptForStudyHours(examsNeedingHours);
    }

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
        needsAttention: daysUntilExam <= 7 && studyHours > (daysUntilExam * 2)
      };
    });

    console.log('Nudge Analysis Result:', analysisResult);
    return analysisResult;
  }

  // Set custom study hours for a specific exam
  setStudyHours(examId, hours) {
    this.studyPlans.set(examId, hours);
  }

  // Get study hours for a specific exam
  getStudyHours(examId) {
    return this.studyPlans.get(examId) || this.defaultStudyHours;
  }
}

export default NudgeManager;

import { addDays, subDays } from 'date-fns';
import NudgeManager from '../NudgeManager';

describe('NudgeManager', () => {
  let nudgeManager;
  const baseDate = new Date('2025-03-14T12:00:00');
  
  beforeEach(() => {
    nudgeManager = new NudgeManager();
    // Mock window.confirm and window.prompt
    global.confirm = jest.fn();
    global.prompt = jest.fn();
  });

  const createMockExam = (id, title, daysFromNow) => ({
    id,
    title,
    type: 'exam',
    start: addDays(baseDate, daysFromNow).toISOString(),
    end: addDays(baseDate, daysFromNow).toISOString(),
    allDay: false
  });

  describe('analyzeUpcomingExams', () => {
    it('should identify exams within the next two weeks', async () => {
      const mockExams = [
        createMockExam('1', 'Exam in 5 days', 5),
        createMockExam('2', 'Exam in 10 days', 10),
        createMockExam('3', 'Exam in 20 days', 20), // Should be filtered out
      ];

      global.confirm.mockReturnValue(false); // Skip study hour prompts
      const analysis = await nudgeManager.analyzeUpcomingExams(mockExams, baseDate);

      expect(analysis).toHaveLength(2);
      expect(analysis[0].examId).toBe('1');
      expect(analysis[1].examId).toBe('2');
    });

    it('should calculate recommended daily study hours correctly', async () => {
      const mockExams = [createMockExam('1', 'Test Exam', 5)];
      
      global.confirm.mockReturnValue(false); // Skip study hour prompts
      const analysis = await nudgeManager.analyzeUpcomingExams(mockExams, baseDate);

      expect(analysis[0].recommendedDailyHours).toBe(2); // 10 hours (default) / 5 days = 2 hours per day
    });

    it('should flag exams needing attention when study hours exceed available time', async () => {
      const mockExams = [createMockExam('1', 'Urgent Exam', 3)];
      
      global.confirm.mockReturnValue(false); // Skip study hour prompts
      nudgeManager.setStudyHours('1', 20); // Set high study hours
      const analysis = await nudgeManager.analyzeUpcomingExams(mockExams, baseDate);

      expect(analysis[0].needsAttention).toBe(true);
    });

    it('should handle user input for study hours', async () => {
      const mockExams = [createMockExam('1', 'Input Test Exam', 7)];
      
      global.confirm.mockReturnValue(true);
      global.prompt.mockReturnValue('15');
      
      const analysis = await nudgeManager.analyzeUpcomingExams(mockExams, baseDate);

      expect(analysis[0].totalStudyHours).toBe(15);
      expect(global.prompt).toHaveBeenCalled();
    });

    it('should use default hours when user provides invalid input', async () => {
      const mockExams = [createMockExam('1', 'Invalid Input Exam', 7)];
      
      global.confirm.mockReturnValue(true);
      global.prompt.mockReturnValue('invalid');
      
      const analysis = await nudgeManager.analyzeUpcomingExams(mockExams, baseDate);

      expect(analysis[0].totalStudyHours).toBe(10); // Default hours
    });
  });

  describe('setStudyHours', () => {
    it('should store and retrieve study hours correctly', () => {
      nudgeManager.setStudyHours('1', 15);
      expect(nudgeManager.getStudyHours('1')).toBe(15);
    });

    it('should return default hours for unset exams', () => {
      expect(nudgeManager.getStudyHours('nonexistent')).toBe(10);
    });
  });

  describe('promptForStudyHours', () => {
    it('should handle user declining to set hours', async () => {
      const mockExams = [
        createMockExam('1', 'Exam 1', 5),
        createMockExam('2', 'Exam 2', 7)
      ];

      global.confirm.mockReturnValue(false);
      await nudgeManager.promptForStudyHours(mockExams);

      expect(nudgeManager.getStudyHours('1')).toBe(10); // Default hours
      expect(nudgeManager.getStudyHours('2')).toBe(10); // Default hours
    });

    it('should process multiple exams correctly', async () => {
      const mockExams = [
        createMockExam('1', 'Exam 1', 5),
        createMockExam('2', 'Exam 2', 7)
      ];

      global.confirm.mockReturnValue(true);
      global.prompt
        .mockReturnValueOnce('15')  // First exam
        .mockReturnValueOnce('20'); // Second exam

      await nudgeManager.promptForStudyHours(mockExams);

      expect(nudgeManager.getStudyHours('1')).toBe(15);
      expect(nudgeManager.getStudyHours('2')).toBe(20);
    });
  });
});

import { addDays } from 'date-fns';
import NudgeManager from '../NudgeManager';

describe('NudgeManager', () => {
  let nudgeManager;
  const baseDate = new Date('2025-03-14T12:00:00');
  let mockStorage = {};
  
  beforeEach(() => {
    mockStorage = {};
    global.localStorage = {
      getItem: (key) => mockStorage[key] ? mockStorage[key] : null,
      setItem: (key, value) => { mockStorage[key] = value; },
      clear: () => { mockStorage = {}; }
    };
    nudgeManager = new NudgeManager();
  });

  const createMockExam = (id, title, daysFromNow) => ({
    id,
    title,
    type: 'exam',
    start: addDays(baseDate, daysFromNow).toISOString(),
    end: addDays(baseDate, daysFromNow).toISOString(),
    allDay: false
  });

  describe('notification behavior', () => {
    it('should show notifications only for exams without study hours', () => {
      const mockExams = [
        createMockExam('1', 'Exam 1', 5),
        createMockExam('2', 'Exam 2', 7),
        { ...createMockExam('3', 'Exam 3', 6), studyHours: 10 }
      ];

      nudgeManager.setStudyHours('1', 15);
      const needingAttention = nudgeManager.getExamsNeedingAttention(mockExams, baseDate);
      
      expect(needingAttention).toHaveLength(1);
      expect(needingAttention[0].id).toBe('2');
    });
  });

  describe('UI integration', () => {
    describe('EventModal data handling', () => {
      it('should handle study hours from modal form submission', () => {
        // Simulate form data from EventModal
        const modalFormData = {
          id: '1',
          title: 'Test Exam',
          type: 'exam',
          start: addDays(baseDate, 5).toISOString().split('T')[0] + 'T14:00:00',
          end: addDays(baseDate, 5).toISOString().split('T')[0] + 'T16:00:00',
          studyHours: '5', // String from form input
          allDay: false
        };

        // Test handling string study hours
        nudgeManager.setStudyHours(modalFormData.id, modalFormData.studyHours);
        const needingAttention = nudgeManager.getExamsNeedingAttention([modalFormData], baseDate);
        expect(needingAttention).toHaveLength(0);
        expect(nudgeManager.getStudyHours(modalFormData.id)).toBe(5);
      });

      it('should handle invalid study hours from modal', () => {
        const modalFormData = {
          id: '1',
          title: 'Test Exam',
          type: 'exam',
          start: addDays(baseDate, 5).toISOString().split('T')[0] + 'T14:00:00',
          end: addDays(baseDate, 5).toISOString().split('T')[0] + 'T16:00:00',
          studyHours: 'invalid', // Invalid input
          allDay: false
        };

        nudgeManager.setStudyHours(modalFormData.id, modalFormData.studyHours);
        const needingAttention = nudgeManager.getExamsNeedingAttention([modalFormData], baseDate);
        expect(needingAttention).toHaveLength(1); // Should show notification for invalid hours
      });

      it('should handle missing type property', () => {
        const modalFormData = {
          id: '1',
          title: 'Test Event',
          start: addDays(baseDate, 5).toISOString().split('T')[0] + 'T14:00:00',
          end: addDays(baseDate, 5).toISOString().split('T')[0] + 'T16:00:00',
          allDay: false
          // type property missing
        };

        const needingAttention = nudgeManager.getExamsNeedingAttention([modalFormData], baseDate);
        expect(needingAttention).toHaveLength(0); // Should ignore non-exam events
      });
    });

    describe('StudyHoursNotification data handling', () => {
      it('should handle study hours from notification panel', () => {
        const exam = createMockExam('1', 'Test Exam', 5);
        
        // Initially should need attention
        expect(nudgeManager.getExamsNeedingAttention([exam], baseDate)).toHaveLength(1);

        // Simulate setting hours through notification panel
        nudgeManager.setStudyHours(exam.id, 3);
        expect(nudgeManager.getExamsNeedingAttention([exam], baseDate)).toHaveLength(0);

        // Verify hours persist in storage
        const newNudgeManager = new NudgeManager(); // Create new instance to test persistence
        expect(newNudgeManager.getExamsNeedingAttention([exam], baseDate)).toHaveLength(0);
        expect(newNudgeManager.getStudyHours(exam.id)).toBe(3);
      });

      it('should sync study hours between notification panel and events', () => {
        const exam = createMockExam('1', 'Test Exam', 5);
        const events = [exam];

        // Set hours through notification panel
        nudgeManager.setStudyHours(exam.id, 4);

        // Verify hours are reflected in event object
        const updatedEvents = events.map(event => 
          event.id === exam.id
            ? { ...event, studyHours: nudgeManager.getStudyHours(event.id) }
            : event
        );

        expect(updatedEvents[0].studyHours).toBe(4);
        expect(nudgeManager.getExamsNeedingAttention(updatedEvents, baseDate)).toHaveLength(0);
      });
    });

    describe('persistence behavior', () => {
      it('should persist study hours across page reloads', () => {
        const exam = createMockExam('1', 'Test Exam', 5);
        
        // Set study hours
        nudgeManager.setStudyHours(exam.id, 5);
        
        // Simulate page reload by creating new NudgeManager instance
        const newNudgeManager = new NudgeManager();
        expect(newNudgeManager.getStudyHours(exam.id)).toBe(5);
      });
    });
  });
});

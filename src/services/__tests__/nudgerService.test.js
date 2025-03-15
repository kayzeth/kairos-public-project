import { identifyUpcomingEvents, getStudyPlan } from '../nudgerService';

// Mock date for consistent testing
const mockDate = new Date('2025-03-15T12:00:00');
const originalDate = global.Date;

describe('Nudger Service', () => {
  // Setup mock date
  beforeAll(() => {
    global.Date = class extends Date {
      constructor(date) {
        if (date) {
          return new originalDate(date);
        }
        return new originalDate(mockDate);
      }
      
      static now() {
        return mockDate.getTime();
      }
    };
  });

  // Restore original Date
  afterAll(() => {
    global.Date = originalDate;
  });

  describe('identifyUpcomingEvents', () => {
    test('should return an empty array when no events are provided', () => {
      const result = identifyUpcomingEvents(null);
      expect(result).toEqual([]);
      
      const result2 = identifyUpcomingEvents([]);
      expect(result2).toEqual([]);
    });

    test('should identify events within the next two weeks', () => {
      // Create dates relative to the mock date
      const today = new Date(mockDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const twoWeeksFromNow = new Date(today);
      twoWeeksFromNow.setDate(today.getDate() + 14);
      
      const threeWeeksFromNow = new Date(today);
      threeWeeksFromNow.setDate(today.getDate() + 21);
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      // Create test events with study keywords
      const events = [
        {
          id: '1',
          title: 'Past Event',
          start: `${yesterday.toISOString().split('T')[0]}T09:00`,
          end: `${yesterday.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '2',
          title: 'Today Event',
          start: `${today.toISOString().split('T')[0]}T09:00`,
          end: `${today.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '3',
          title: 'Exam Tomorrow',
          start: `${tomorrow.toISOString().split('T')[0]}T09:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '4',
          title: 'Quiz Next Week',
          start: `${nextWeek.toISOString().split('T')[0]}T09:00`,
          end: `${nextWeek.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '5',
          title: 'Assignment Due',
          start: `${twoWeeksFromNow.toISOString().split('T')[0]}T09:00`,
          end: `${twoWeeksFromNow.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '6',
          title: 'Three Weeks Event',
          start: `${threeWeeksFromNow.toISOString().split('T')[0]}T09:00`,
          end: `${threeWeeksFromNow.toISOString().split('T')[0]}T10:00`,
        },
      ];
      
      const result = identifyUpcomingEvents(events);
      
      // Should identify 3 events (exam, quiz, assignment)
      expect(result.length).toBe(3);
      
      // Check that the correct events were identified
      expect(result.some(e => e.title === 'Exam Tomorrow')).toBe(true);
      expect(result.some(e => e.title === 'Quiz Next Week')).toBe(true);
      expect(result.some(e => e.title === 'Assignment Due')).toBe(true);
      
      // Check that past and far future events are not included
      expect(result.some(e => e.title === 'Past Event')).toBe(false);
      expect(result.some(e => e.title === 'Three Weeks Event')).toBe(false);
    });

    test('should identify events based on keywords in title', () => {
      const today = new Date(mockDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const events = [
        {
          id: '1',
          title: 'Regular Meeting',
          start: `${tomorrow.toISOString().split('T')[0]}T09:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '2',
          title: 'Exam in Math',
          start: `${tomorrow.toISOString().split('T')[0]}T11:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T12:00`,
        },
        {
          id: '3',
          title: 'Quiz on Chapter 5',
          start: `${tomorrow.toISOString().split('T')[0]}T13:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T14:00`,
        },
        {
          id: '4',
          title: 'Assignment Due',
          start: `${tomorrow.toISOString().split('T')[0]}T15:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T16:00`,
        },
        {
          id: '5',
          title: 'Project Presentation',
          start: `${tomorrow.toISOString().split('T')[0]}T17:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T18:00`,
        },
      ];
      
      const result = identifyUpcomingEvents(events);
      
      // Should identify 4 events (exam, quiz, assignment, project)
      expect(result.length).toBe(4);
      
      // Check that the correct events were identified
      expect(result.some(e => e.title === 'Exam in Math')).toBe(true);
      expect(result.some(e => e.title === 'Quiz on Chapter 5')).toBe(true);
      expect(result.some(e => e.title === 'Assignment Due')).toBe(true);
      expect(result.some(e => e.title === 'Project Presentation')).toBe(true);
      
      // Check that regular meeting is not included
      expect(result.some(e => e.title === 'Regular Meeting')).toBe(false);
    });

    test('should identify events based on keywords in description', () => {
      const today = new Date(mockDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const events = [
        {
          id: '1',
          title: 'Class Session',
          description: 'Regular class lecture',
          start: `${tomorrow.toISOString().split('T')[0]}T09:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '2',
          title: 'Important Session',
          description: 'Midterm exam covering chapters 1-5',
          start: `${tomorrow.toISOString().split('T')[0]}T11:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T12:00`,
        },
        {
          id: '3',
          title: 'Group Meeting',
          description: 'Work on group project',
          start: `${tomorrow.toISOString().split('T')[0]}T13:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T14:00`,
        },
      ];
      
      const result = identifyUpcomingEvents(events);
      
      // Should identify 2 events (exam in description, project in description)
      expect(result.length).toBe(2);
      
      // Check that the correct events were identified
      expect(result.some(e => e.title === 'Important Session')).toBe(true);
      expect(result.some(e => e.title === 'Group Meeting')).toBe(true);
      
      // Check that regular class is not included
      expect(result.some(e => e.title === 'Class Session')).toBe(false);
    });

    test('should add metadata to identified events', () => {
      const today = new Date(mockDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const events = [
        {
          id: '1',
          title: 'Midterm Exam',
          start: `${tomorrow.toISOString().split('T')[0]}T09:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '2',
          title: 'Quiz',
          start: `${tomorrow.toISOString().split('T')[0]}T11:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T12:00`,
        },
      ];
      
      const result = identifyUpcomingEvents(events);
      
      // Should identify both events
      expect(result.length).toBe(2);
      
      // Check metadata for exam
      const examEvent = result.find(e => e.title === 'Midterm Exam');
      expect(examEvent).toBeDefined();
      expect(examEvent.requiresStudy).toBe(true);
      expect(examEvent.suggestedStudyHours).toBe(5); // Exams get 5 hours
      expect(examEvent.identifiedBy).toBe('nudger');
      
      // Check metadata for quiz
      const quizEvent = result.find(e => e.title === 'Quiz');
      expect(quizEvent).toBeDefined();
      expect(quizEvent.requiresStudy).toBe(true);
      expect(quizEvent.suggestedStudyHours).toBe(3); // Quizzes get 3 hours
      expect(quizEvent.identifiedBy).toBe('nudger');
    });
  });

  describe('getStudyPlan', () => {
    test('should return empty plan when no events are provided', () => {
      const result = getStudyPlan([]);
      
      expect(result.events).toEqual([]);
      expect(result.totalStudyHours).toBe(0);
      expect(result.eventCount).toBe(0);
      expect(result.eventsByDate).toEqual({});
    });

    test('should calculate total study hours and group events by date', () => {
      const today = new Date(mockDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      
      const events = [
        {
          id: '1',
          title: 'Midterm Exam',
          start: `${tomorrow.toISOString().split('T')[0]}T09:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T10:00`,
        },
        {
          id: '2',
          title: 'Quiz',
          start: `${tomorrow.toISOString().split('T')[0]}T11:00`,
          end: `${tomorrow.toISOString().split('T')[0]}T12:00`,
        },
        {
          id: '3',
          title: 'Final Project',
          start: `${dayAfterTomorrow.toISOString().split('T')[0]}T13:00`,
          end: `${dayAfterTomorrow.toISOString().split('T')[0]}T14:00`,
        },
      ];
      
      const result = getStudyPlan(events);
      
      // Should identify all 3 events
      expect(result.eventCount).toBe(3);
      
      // Check total study hours (5 for exam + 3 for quiz + 5 for project = 13)
      expect(result.totalStudyHours).toBe(13);
      
      // Check events grouped by date
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      const dayAfterTomorrowDate = dayAfterTomorrow.toISOString().split('T')[0];
      
      expect(Object.keys(result.eventsByDate).length).toBe(2);
      expect(result.eventsByDate[tomorrowDate].length).toBe(2);
      expect(result.eventsByDate[dayAfterTomorrowDate].length).toBe(1);
    });
  });
});

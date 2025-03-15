/**
 * Nudger Service - KAIR-15
 * 
 * This service identifies events in the next two weeks that may require 
 * additional study time, such as exams and assignments.
 */

/**
 * Identifies events in the next two weeks that may require additional study time
 * @param {Array} events - Array of calendar events
 * @returns {Array} - Array of events that need additional study time
 */
export const identifyUpcomingEvents = (events) => {
  if (!events || !Array.isArray(events)) {
    console.warn('Nudger: No events provided or invalid events format');
    return [];
  }

  // Calculate date range (now to two weeks from now)
  const now = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(now.getDate() + 14);
  
  console.log(`Nudger: Scanning for events between ${now.toLocaleDateString()} and ${twoWeeksFromNow.toLocaleDateString()}`);

  // Filter events within the next two weeks
  const upcomingEvents = events.filter(event => {
    // Parse event start date
    const eventDate = new Date(event.start.split('T')[0]);
    
    // Check if event is within the next two weeks
    return eventDate >= now && eventDate <= twoWeeksFromNow;
  });

  console.log(`Nudger: Found ${upcomingEvents.length} events in the next two weeks`);
  
  // Identify events that may need study time (exams, assignments, etc.)
  const studyEvents = upcomingEvents.filter(event => {
    const title = event.title.toLowerCase();
    const description = (event.description || '').toLowerCase();
    
    // Keywords that might indicate an event requiring study time
    const studyKeywords = [
      'exam', 'test', 'quiz', 'midterm', 'final', 
      'assignment', 'homework', 'project', 'paper', 'essay',
      'presentation', 'deadline'
    ];
    
    // Check if event title or description contains any study keywords
    return studyKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  });

  console.log(`Nudger: Identified ${studyEvents.length} events that may require study time`);
  
  // Add metadata to identified events
  return studyEvents.map(event => ({
    ...event,
    requiresStudy: true,
    suggestedStudyHours: estimateStudyHours(event),
    identifiedBy: 'nudger'
  }));
};

/**
 * Estimates recommended study hours based on event type
 * @param {Object} event - Calendar event
 * @returns {number} - Estimated study hours
 */
const estimateStudyHours = (event) => {
  const title = event.title.toLowerCase();
  // eslint-disable-next-line no-unused-vars
  const description = (event.description || '').toLowerCase();
  
  // Default study hours
  let hours = 2;
  
  // Adjust based on event type
  if (title.includes('exam') || title.includes('final') || title.includes('midterm')) {
    hours = 5; // Exams require more study time
  } else if (title.includes('quiz') || title.includes('test')) {
    hours = 3; // Quizzes require moderate study time
  } else if (title.includes('project') || title.includes('paper') || title.includes('essay')) {
    hours = 4; // Projects and papers require significant time
  }
  
  return hours;
};

/**
 * Gets all events that require study time
 * @param {Array} events - Array of calendar events
 * @returns {Object} - Object containing study events and statistics
 */
export const getStudyPlan = (events) => {
  const studyEvents = identifyUpcomingEvents(events);
  
  // Calculate total study hours needed
  const totalStudyHours = studyEvents.reduce((total, event) => 
    total + event.suggestedStudyHours, 0);
  
  // Group events by date
  const eventsByDate = studyEvents.reduce((groups, event) => {
    const date = event.start.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});
  
  return {
    events: studyEvents,
    totalStudyHours,
    eventsByDate,
    eventCount: studyEvents.length
  };
};

// Create a named export object
const nudgerService = {
  identifyUpcomingEvents,
  getStudyPlan
};

export default nudgerService;

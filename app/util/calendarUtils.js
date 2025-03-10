import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Generates an array of time slots for the day view
 * @param {Date} date - The date to create time slots for
 * @param {number} startHour - Start hour of the day (0-23)
 * @param {number} endHour - End hour of the day (0-23)
 * @returns {Array} Array of time slots
 */
export function generateDayTimeSlots(date, startHour = 7, endHour = 21) {
  const timeSlots = [];
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const slotTime = new Date(baseDate);
    slotTime.setHours(hour);
    
    timeSlots.push({
      id: `time-${hour}`,
      hour,
      time: slotTime,
      label: format(slotTime, 'h:mm a')
    });
  }
  
  return timeSlots;
}

/**
 * Gets the date range for the current view
 * @param {Date} currentDate - The current center date
 * @param {string} viewType - The type of view (day, week, month)
 * @returns {Object} Object with start and end dates
 */
export function getDateRangeForView(currentDate, viewType) {
  const date = new Date(currentDate);
  
  switch (viewType) {
    case 'day':
      return {
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999))
      };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
    default:
      return {
        start: date,
        end: date
      };
  }
}

/**
 * Filters classes based on the current date range
 * @param {Array} classes - All classes
 * @param {Date} startDate - Start of the range
 * @param {Date} endDate - End of the range
 * @returns {Array} Filtered classes
 */
export function filterClassesByDateRange(classes, startDate, endDate) {
  return classes.filter(classItem => {
    const classDate = new Date(classItem.date);
    return classDate >= startDate && classDate <= endDate;
  });
}

// Calendar utility functions and constants

export const VIEW_TYPES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

// Formats calendar events from class data
export function formatClassesToEvents(classes, selectedStudentId) {
  const filtered = selectedStudentId === 'all'
    ? classes
    : classes.filter(c => c.studentId === selectedStudentId);
  
  return filtered.map(classItem => {
    // Check if this class has a custom rate different from the student's default
    const hasCustomRate = classItem.lessonRate && classItem.lessonRate !== classItem.student.lessonRate;
    
    return {
      id: classItem.id,
      title: hasCustomRate ? `${classItem.student.name} ($)` : classItem.student.name,
      start: new Date(classItem.date),
      end: new Date(new Date(classItem.date).getTime() + 60 * 60 * 1000), // Add 1 hour
      studentId: classItem.studentId,
      student: classItem.student,
      lessonRate: classItem.lessonRate || classItem.student.lessonRate,
      hasCustomRate,
      resource: classItem
    };
  });
}

// Generate color mapping for students
export function generateStudentColors(students) {
  const colors = [
    'blue-500', 'green-500', 'purple-500', 'yellow-500', 
    'pink-500', 'indigo-500', 'red-500', 'teal-500'
  ];
  
  return students.reduce((acc, student, index) => {
    acc[student.id] = colors[index % colors.length];
    return acc;
  }, {});
}

// Get styles for calendar events based on student
export function getEventStyle(event, students) {
  const studentIndex = students.findIndex(s => s.id === event.studentId);
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
  ];
  
  const colorIndex = studentIndex % colors.length;
  const color = colors[colorIndex].replace('bg-', '');
  
  return {
    style: {
      backgroundColor: `var(--${color})`,
      borderRadius: '4px',
      color: "#000", // Use black text for better readability
    }
  };
}

// Calendar formats configuration
export const calendarFormats = {
  eventTimeRangeFormat: () => '', // Do not display time range in events
};

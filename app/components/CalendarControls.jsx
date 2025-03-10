import { VIEW_TYPES } from '~/util/calendarHelpers';
import format from 'date-fns/format/index.js';

export default function CalendarControls({
  viewType, 
  setViewType,
  currentDate,
  navigatePrevious,
  navigateNext, 
  goToToday,
  selectedStudentId,
  setSelectedStudentId,
  students
}) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4 p-4 bg-white rounded-lg shadow">
      {/* Left side with navigation controls */}
      <div className="flex items-center space-x-2 justify-between md:justify-start">
        <div className="flex items-center">
          <button 
            onClick={navigatePrevious}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
          >
            Today
          </button>
          <button 
            onClick={navigateNext}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="ml-2 text-lg font-semibold hidden md:block">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
      </div>
      
      {/* Right side with view toggles and filter */}
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setViewType(VIEW_TYPES.DAY)}
            className={`relative flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-l-md ${
              viewType === VIEW_TYPES.DAY
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setViewType(VIEW_TYPES.WEEK)}
            className={`relative flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium ${
              viewType === VIEW_TYPES.WEEK
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewType(VIEW_TYPES.MONTH)}
            className={`relative flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-r-md ${
              viewType === VIEW_TYPES.MONTH
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
        </div>
        
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="all">All Students</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

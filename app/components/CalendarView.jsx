import { Calendar as BigCalendar } from 'react-big-calendar';
import { calendarFormats, getEventStyle, VIEW_TYPES } from '~/util/calendarHelpers';

export default function CalendarView({
  localizer,
  events,
  viewType,
  currentDate,
  setCurrentDate,
  setViewType,
  handleEventClick,
  handleSelectSlot,
  students
}) {
  // Event style getter for coloring events by student
  const eventStyleGetter = (event) => getEventStyle(event, students);

  return (
    <div className="bg-white rounded-lg shadow flex-grow p-4 min-h-[650px] overflow-hidden">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100% - 20px)', minHeight: '600px' }}
        views={{
          month: true,
          week: true,
          day: true
        }}
        view={viewType.toLowerCase()}
        date={currentDate}
        onNavigate={date => setCurrentDate(date)}
        onView={view => {
          if (view === 'day') setViewType(VIEW_TYPES.DAY);
          else if (view === 'week') setViewType(VIEW_TYPES.WEEK);
          else if (view === 'month') setViewType(VIEW_TYPES.MONTH);
        }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventClick}
        onSelectSlot={handleSelectSlot}
        selectable={true}
        popup={true}
        components={{
          toolbar: () => null, // Hide default toolbar
        }}
        min={new Date(1970, 0, 1, 6, 0, 0)}  // Calendar visible from 6am
        max={new Date(1970, 0, 1, 21, 0, 0)} // Calendar visible until 9pm
        formats={calendarFormats}
      />
    </div>
  );
}

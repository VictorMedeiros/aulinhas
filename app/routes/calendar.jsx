import { json } from '@remix-run/node';
import { useLoaderData, useNavigation } from '@remix-run/react';
import { requireAuth } from '~/services/auth.server';
import { prisma } from '~/util/db.server';
import { dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format/index.js';
import parse from 'date-fns/parse/index.js';
import startOfWeek from 'date-fns/startOfWeek/index.js';
import getDay from 'date-fns/getDay/index.js';
import enUS from 'date-fns/locale/en-US/index.js';
import PageLayout from '~/components/PageLayout';
import LoadingIndicator from '~/components/LoadingIndicator';
import ClassModal from '~/components/ClassModal';
import CalendarControls from '~/components/CalendarControls';
import CalendarView from '~/components/CalendarView';
import ConfirmationModal from '~/components/ConfirmationModal'; // Add this import
import { useCalendar } from '~/hooks/useCalendar';

// Setup date-fns localizer for react-big-calendar
const defaultLocale = typeof navigator !== "undefined" ? navigator.language : "en-US";
const locales = { [defaultLocale]: enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export const links = () => [
  { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/react-big-calendar@1.8.4/lib/css/react-big-calendar.css" }
];

export const loader = async ({ request }) => {
  // Require authentication and get the user
  const user = await requireAuth(request);
  
  // Fetch all classes with student information for the authenticated user
  const [classes, students] = await Promise.all([
    prisma.class.findMany({
      include: {
        student: true,
      },
      where: {
        student: {
          userId: user.id
        }
      },
      orderBy: {
        date: 'asc',
      },
    }),
    prisma.student.findMany({
      where: {
        userId: user.id
      }
    }),
  ]);

  // Make sure all dates are properly serialized
  const serializedClasses = classes.map(classItem => ({
    ...classItem,
    date: classItem.date.toISOString()
  }));

  return json({ classes: serializedClasses, students, user });
};

export default function Calendar() {
  const { classes, students } = useLoaderData();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  
  // Use our custom calendar hook
  const calendar = useCalendar({ classes, students });
  
  return (
    <PageLayout title="Calendar">
      {isLoading ? (
        <LoadingIndicator size="large" />
      ) : (
        <div className="flex flex-col h-full">
          <CalendarControls
            viewType={calendar.viewType}
            setViewType={calendar.setViewType}
            currentDate={calendar.currentDate}
            navigatePrevious={calendar.navigatePrevious}
            navigateNext={calendar.navigateNext}
            goToToday={calendar.goToToday}
            selectedStudentId={calendar.selectedStudentId}
            setSelectedStudentId={calendar.setSelectedStudentId}
            students={students}
          />
          
          <CalendarView
            localizer={localizer}
            events={calendar.events}
            viewType={calendar.viewType}
            currentDate={calendar.currentDate}
            setCurrentDate={calendar.setCurrentDate}
            setViewType={calendar.setViewType}
            handleEventClick={calendar.handleEventClick}
            handleSelectSlot={calendar.handleSelectSlot}
            students={students}
          />

          {/* Class Creation Modal */}
          {calendar.selectedSlot && (
            <ClassModal
              students={students}
              isOpen={calendar.isNewClassModalOpen}
              onClose={calendar.handleNewClassModalClose}
              onSave={calendar.handleClassCreated}
              isNew={true}
              preselectedDate={calendar.selectedSlot.start}
              noDefaultStudent={calendar.noDefaultStudent}
            />
          )}
          
          {/* Class Edit Modal */}
          {calendar.selectedClass && (
            <ClassModal
              classItem={calendar.selectedClass}
              students={students}
              isOpen={calendar.isClassModalOpen}
              onClose={() => calendar.setIsClassModalOpen(false)}
              onSave={calendar.handleClassUpdated}
              isEditing={true}
              onDelete={calendar.handleDeleteFromModal} // This now opens the confirmation modal
            />
          )}
          
          {/* Add Confirmation Modal */}
          <ConfirmationModal 
            isOpen={calendar.deleteConfirmation.isOpen}
            onClose={calendar.cancelDelete}
            onConfirm={calendar.confirmDelete}
            title="Delete Class"
            message="Are you sure you want to delete this class? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />
          
          {/* Add a loading indicator when refreshing data */}
          {calendar.isRefreshing && <LoadingIndicator fullScreen={true} />}
        </div>
      )}
    </PageLayout>
  );
}

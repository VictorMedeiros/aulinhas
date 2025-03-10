import { useState, useEffect, useMemo } from 'react';
import { useFetcher } from '@remix-run/react';
import { useToast } from '~/components/ToastProvider';
import { 
  formatClassesToEvents, 
  generateStudentColors, 
  VIEW_TYPES 
} from '~/util/calendarHelpers';

export function useCalendar({ classes, students }) {
  const toast = useToast();
  const fetcher = useFetcher();
  
  // State for calendar view
  const [viewType, setViewType] = useState(VIEW_TYPES.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [noDefaultStudent, setNoDefaultStudent] = useState(false);
  
  // Replace the simple confirmation with a state object
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    classId: null
  });
  
  // Compute student colors
  const studentColors = useMemo(() => 
    generateStudentColors(students), [students]);

  // Convert classes to calendar events
  const events = useMemo(() => 
    formatClassesToEvents(classes, selectedStudentId), 
    [classes, selectedStudentId]);

  useEffect(() => {
    if (fetcher.state === "idle" && isRefreshing) {
      if (fetcher.data) {
        if (fetcher.data.success) {
          // Check the action type from the form data to show the appropriate message
          const actionType = fetcher.form?.get("actionType");
          if (actionType === "create") {
            toast?.success("Class successfully created!");
          } else if (actionType === "update") {
            toast?.success("Class successfully updated!");
          } else if (actionType === "delete") {
            toast?.success("Class successfully deleted!");
          }
        } else if (fetcher.data.error) {
          toast?.error(fetcher.data.error);
        }
      }
      setIsRefreshing(false);
    }
  }, [fetcher.state, fetcher.data, fetcher.form, isRefreshing, toast]);

  // Handle clicking on an event
  const handleEventClick = (event) => {
    console.log("Event clicked:", event);
    
    if (event && event.resource) {
      setSelectedClass(event.resource);
      setIsClassModalOpen(true);
    } else {
      toast.error("Could not load class details");
    }
  };
  
  // Handle selecting a time slot to create a new class
  const handleSelectSlot = ({ start, end }) => {
    // Check if there's already an existing class at this time
    const existingClass = events.find(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const slotStart = new Date(start);
      
      // Check if the slot's start time falls within the event's time range
      return eventStart <= slotStart && slotStart < eventEnd;
    });

    if (existingClass) {
      // If there's an existing class, use the handleEventClick logic
      handleEventClick(existingClass);
    } else {
      // Otherwise, create a new class with no default student
      setSelectedSlot({ start, end });
      setNoDefaultStudent(true);  // Set flag to indicate no default student
      setIsNewClassModalOpen(true);
    }
  };

  // Handle when a new class is created from the modal
  const handleClassCreated = () => {
    setIsNewClassModalOpen(false);
    setIsRefreshing(true); // Ensure this is set when creating a class
  };

  // Handle when a class is updated or deleted from the modal
  const handleClassUpdated = () => {
    setIsClassModalOpen(false);
    setIsNewClassModalOpen(false);
    setIsRefreshing(true); // Ensure this is set when updating a class
  };
  
  // Update handleDeleteFromModal to use the confirmation state
  const handleDeleteFromModal = () => {
    if (selectedClass) {
      setDeleteConfirmation({
        isOpen: true,
        classId: selectedClass.id
      });
    }
  };

  // Add new function to handle actual deletion after confirmation
  const confirmDelete = () => {
    if (deleteConfirmation.classId) {
      setIsRefreshing(true); // Set refreshing state before submitting
      fetcher.submit(
        { actionType: "delete", classId: deleteConfirmation.classId },
        { method: "post", action: "/classes" }
      );
      setDeleteConfirmation({ isOpen: false, classId: null });
      setIsClassModalOpen(false);
    }
  };

  // Add function to cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, classId: null });
  };

  // Reset the noDefaultStudent flag when modal is closed
  const handleNewClassModalClose = () => {
    setIsNewClassModalOpen(false);
    setNoDefaultStudent(false);
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === VIEW_TYPES.DAY) {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewType === VIEW_TYPES.WEEK) {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewType === VIEW_TYPES.MONTH) {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === VIEW_TYPES.DAY) {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewType === VIEW_TYPES.WEEK) {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewType === VIEW_TYPES.MONTH) {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  return {
    events,
    viewType,
    setViewType,
    currentDate,
    setCurrentDate,
    selectedStudentId,
    setSelectedStudentId,
    isNewClassModalOpen,
    setIsNewClassModalOpen,
    handleNewClassModalClose,  // Export the new close handler
    noDefaultStudent,  // Export the flag
    selectedSlot,
    isClassModalOpen,
    setIsClassModalOpen,  // Add this line to export the function
    selectedClass,
    studentColors,
    showLegend,
    setShowLegend,
    handleEventClick,
    handleSelectSlot,
    handleClassCreated,
    handleClassUpdated,
    handleDeleteFromModal,
    deleteConfirmation,
    confirmDelete,
    cancelDelete,
    navigatePrevious,
    navigateNext,
    goToToday,
    isRefreshing, // Make sure we're exporting isRefreshing
  };
}

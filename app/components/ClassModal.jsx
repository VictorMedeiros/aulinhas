import { useEffect, useRef, useState } from 'react';
import { useFetcher } from '@remix-run/react';

export default function ClassModal({ classItem, students, isOpen, onClose, onSave, isNew = false, isEditing = false }) {
  const modalRef = useRef(null);
  const [isEditingState, setIsEditing] = useState(isNew || isEditing);
  const fetcher = useFetcher();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    if (!isOpen) {
      setIsEditing(isNew || isEditing);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isNew, isEditing]);
  
  useEffect(() => {
    setIsEditing(isNew || isEditing);
  }, [isNew, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const isSubmitting = fetcher.state !== "idle";
  const isSuccess = fetcher.data?.success;
  
  useEffect(() => {
    if (!isSubmitting && isSuccess && fetcher.data) {
      onSave();
      fetcher.data = null;
    }
  }, [isSubmitting, isSuccess, onSave, fetcher]);

  const handleSubmit = (event) => {
    // Get the date value from the form
    const formData = new FormData(event.target);
    const date = formData.get('date');
    
    console.log('CLIENT - Form submission - Raw date value:', date);
    console.log('CLIENT - Form submission - Current browser datetime:', new Date().toString());
    console.log('CLIENT - Form submission - All form data:', Object.fromEntries(formData.entries()));
    
    // Let the form submission continue normally
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Format as DD/MM/YYYY HH:mm
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (!isOpen) return null;
  
  const modalTitle = isNew 
    ? 'Add New Class' 
    : (isEditingState ? 'Edit Class' : `Class for ${classItem?.student?.name || 'Student'}`);
  
  const defaultStudentId = isNew ? '' : classItem.studentId;
  
  // Extract date and time from the class date
  const classDate = isNew ? new Date() : new Date(classItem.date);
  const defaultDate = classDate.toISOString().split('T')[0];
  
  // Format time as HH:MM
  const hours = classDate.getHours().toString().padStart(2, '0');
  const minutes = classDate.getMinutes().toString().padStart(2, '0');
  const defaultTime = `${hours}:${minutes}`;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>
        
        {isEditingState || isNew ? (
          <fetcher.Form method="post" action="/classes" onSubmit={handleSubmit}>
            <input type="hidden" name="actionType" value={isNew ? "create" : "update"} />
            {!isNew && <input type="hidden" name="classId" value={classItem?.id} />}
            <div className="mb-4">
              <label className="block mb-1">Student</label>
              <select
                name="studentId"
                defaultValue={defaultStudentId}
                className="w-full border px-3 py-2"
                required
                disabled={isSubmitting}
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Date and Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="date"
                  defaultValue={defaultDate}
                  className="flex-grow border px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
                <input
                  type="time"
                  name="time"
                  defaultValue={defaultTime}
                  className="w-24 border px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (isNew ? 'Create Class' : 'Save')}
              </button>
            </div>
          </fetcher.Form>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">Student: {classItem.student?.name}</p>
              <p className="text-gray-600">
                Date & Time: {formatDate(classItem.date)}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

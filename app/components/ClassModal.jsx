import { useEffect, useRef, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { format } from 'date-fns';

export default function ClassModal({ 
  classItem, 
  students, 
  isOpen, 
  onClose, 
  onSave, 
  isNew = false, 
  isEditing = false,
  preselectedDate = null,
  onDelete,
  noDefaultStudent = false
}) {
  const modalRef = useRef(null);
  const [isEditingState, setIsEditing] = useState(isNew || isEditing);
  const fetcher = useFetcher();
  
  // Initialize selectedStudent based on noDefaultStudent flag
  const initialStudentId = classItem?.studentId || 
    (students.length > 0 && !noDefaultStudent ? students[0].id : '');
  
  const [selectedStudent, setSelectedStudent] = useState(initialStudentId);

  // Reset selected student when modal opens/closes or when noDefaultStudent changes
  useEffect(() => {
    if (isOpen) {
      if (classItem?.studentId) {
        setSelectedStudent(classItem.studentId);
      } else if (noDefaultStudent) {
        setSelectedStudent('');
      } else if (students.length > 0) {
        setSelectedStudent(students[0].id);
      }
    }
  }, [isOpen, classItem, noDefaultStudent, students]);

  // Get default lesson rate for the selected student
  const getDefaultRate = () => {
    if (!isNew && classItem?.lessonRate) return classItem.lessonRate;
    
    const student = students.find(s => s.id === selectedStudent);
    return student ? student.lessonRate : '';
  };
  
  const [customRate, setCustomRate] = useState(getDefaultRate());

  // Add this effect to update the rate when classItem changes
  useEffect(() => {
    if (!isNew && classItem?.lessonRate !== undefined) {
      setCustomRate(classItem.lessonRate);
    }
  }, [classItem, isNew]);

  // Format date for input field
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };
  
  // Format time for input field
  const formatTimeForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Set default date and time values
  const defaultDate = isNew 
    ? (preselectedDate ? formatDateForInput(preselectedDate) : formatDateForInput(new Date()))
    : formatDateForInput(classItem.date);

  const defaultTime = isNew
    ? (preselectedDate ? formatTimeForInput(preselectedDate) : '10:00')
    : formatTimeForInput(classItem.date);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  // Update custom rate when student changes
  useEffect(() => {
    if ((isNew || isEditingState) && !classItem?.lessonRate) {
      const student = students.find(s => s.id === selectedStudent);
      setCustomRate(student ? student.lessonRate : '');
    }
  }, [selectedStudent, isNew, isEditingState, students, classItem]);

  const isSubmitting = fetcher.state !== "idle";
  const isSuccess = fetcher.data?.success;
  
  useEffect(() => {
    if (!isSubmitting && isSuccess && fetcher.data) {
      onSave();
      fetcher.data = null;
    }
  }, [isSubmitting, isSuccess, onSave, fetcher]);

  if (!isOpen) return null;
  
  const modalTitle = isNew 
    ? 'Add New Class' 
    : (isEditingState ? 'Edit Class' : `Class with ${classItem?.student?.name || ''}`);

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
        
        <fetcher.Form method="post" action="/classes">
          <input type="hidden" name="actionType" value={isNew ? "create" : "update"} />
          {!isNew && <input type="hidden" name="classId" value={classItem?.id} />}
          
          <div className="mb-4">
            <label className="block mb-1">Student</label>
            <select
              name="studentId"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
              disabled={isSubmitting}
            >
              {noDefaultStudent && <option value="">Select a student</option>}
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Date</label>
            <input
              type="date"
              name="date"
              defaultValue={defaultDate}
              className="w-full border px-3 py-2 rounded"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Time</label>
            <input
              type="time"
              name="time"
              defaultValue={defaultTime}
              className="w-full border px-3 py-2 rounded"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Lesson Rate</label>
            <div className="flex items-center">
              <span className="mr-2">$</span>
              <input
                type="number"
                name="lessonRate"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                min="0"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty to use the student's default rate</p>
          </div>
          
          <div className="flex justify-end gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={() => onDelete && onDelete()}
                className="bg-red-500 text-white px-4 py-2 rounded flex items-center justify-center"
                disabled={isSubmitting}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 border rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
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
              ) : (isNew ? 'Add Class' : 'Save')}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}

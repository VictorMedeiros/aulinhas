import { useEffect, useRef, useState } from 'react';
import { useFetcher } from '@remix-run/react';

export default function StudentModal({ student, isOpen, onClose, onSave, isNew = false, isEditing = false }) {
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

  if (!isOpen) return null;
  
  const modalTitle = isNew 
    ? 'Add New Student' 
    : (isEditingState ? 'Edit Student' : student.name);
  
  const defaultName = isNew ? '' : student.name;
  const defaultRate = isNew ? 100 : student.lessonRate;
  
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
          <fetcher.Form method="post" action="/students">
            <input type="hidden" name="actionType" value={isNew ? "create" : "update"} />
            {!isNew && <input type="hidden" name="studentId" value={student?.id} />}
            <div className="mb-4">
              <label className="block mb-1">Name</label>
              <input
                type="text"
                name="name"
                defaultValue={defaultName}
                className="w-full border px-3 py-2"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Lesson Rate</label>
              <input
                type="number"
                name="lessonRate"
                step="1"
                defaultValue={defaultRate}
                className="w-full border px-3 py-2"
                required
                min="1"
                max="1000"
                disabled={isSubmitting}
              />
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
                ) : (isNew ? 'Create Student' : 'Save')}
              </button>
            </div>
          </fetcher.Form>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">Lesson Rate: ${student.lessonRate}</p>
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

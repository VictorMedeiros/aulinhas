import { useEffect, useRef, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import ClassModal from './ClassModal';

export default function StudentModal({ student, isOpen, onClose, onSave, isNew = false, isEditing = false }) {
  const modalRef = useRef(null);
  const [isEditingState, setIsEditing] = useState(isNew || isEditing);
  const fetcher = useFetcher();
  const [age, setAge] = useState(student?.age || "");
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (!isOpen) return null;

  const modalTitle = isNew 
    ? 'Add New Student' 
    : (isEditingState ? 'Edit Student' : student.name);

  const defaultName = isNew ? '' : student.name;
  const defaultRate = isNew ? 100 : student.lessonRate;
  const defaultAge = isNew ? '' : student.age;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
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
            <div className="mb-4">
              <label className="block mb-1">Age</label>
              <input
                type="number"
                name="age"
                step="1"
                onChange={(e) => setAge(e.target.value)}
                defaultValue={defaultAge}
                className="w-full border px-3 py-2"
                min="1"
                max="100"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              {!isNew && (
                <button
                  type="button"
                  onClick={() => onClose()}
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
              
              {/* Classes section */}
              {student.classes && student.classes.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Classes</h3>
                  <div className="max-h-64 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {student.classes.map((classItem) => (
                        <li key={classItem.id} className="py-2">
                          <p className="text-gray-800">{formatDate(classItem.date)}
                            {classItem.lessonRate && classItem.lessonRate !== student.lessonRate && (
                              <span className="ml-2 text-blue-500 text-sm">
                                Custom Rate: ${classItem.lessonRate}
                              </span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Classes</h3>
                  <p className="text-gray-500">No classes scheduled</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsClassModalOpen(true)}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Add Class
              </button>
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
      {isClassModalOpen && (
        <ClassModal
          isOpen={isClassModalOpen}
          onClose={() => setIsClassModalOpen(false)}
          onSave={() => {
            setIsClassModalOpen(false);
            onSave(); // Refresh parent component
          }}
          isNew={true}
          students={[student]} // Pass current student as the only option
          classItem={{
            studentId: student.id,
            date: new Date(),
            lessonRate: student.lessonRate, // Add the student's lesson rate
            student: student // Add the full student object
          }}
        />
      )}
    </div>
  );
}

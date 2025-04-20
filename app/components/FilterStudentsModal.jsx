import { useState, useEffect } from 'react';

export default function FilterStudentsModal({ isOpen, onClose, students, selectedStudents, onSave }) {
  const [selected, setSelected] = useState(selectedStudents);

  useEffect(() => {
    setSelected(selectedStudents);
  }, [selectedStudents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Filter Students</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          {students.map((student) => (
            <label key={student.id} className="flex items-center space-x-3 mb-2">
              <input
                type="checkbox"
                checked={selected.includes(student.id)}
                onChange={(e) => {
                  setSelected(prev => 
                    e.target.checked 
                      ? [...prev, student.id]
                      : prev.filter(id => id !== student.id)
                  );
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-gray-700">{student.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setSelected([]);
              onSave([]);
            }}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Show All
          </button>
          <button
            onClick={() => onSave(selected)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
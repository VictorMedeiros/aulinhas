import React from 'react';

export default function StudentColorLegend({ students, studentColors, selectedIds, onToggleStudent }) {
  return (
    <div className="flex flex-wrap gap-2">
      {students.map(student => {
        const color = studentColors[student.id] || 'blue-500';
        const isSelected = selectedIds.includes(student.id);
        return (
          <button
            key={student.id}
            onClick={() => onToggleStudent(student.id)}
            className={`flex items-center gap-1 border rounded px-2 py-1 text-sm 
              ${isSelected ? `bg-${color} text-white` : 'bg-white text-gray-700'}`}
          >
            <span className={`w-3 h-3 rounded-full bg-${color}`}></span>
            <span>{student.name}</span>
          </button>
        );
      })}
    </div>
  );
}

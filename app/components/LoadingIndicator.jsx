import React from 'react';

export default function LoadingIndicator({ size = 'medium', fullScreen = false }) {
  let sizeClasses = '';
  
  switch (size) {
    case 'small':
      sizeClasses = 'h-4 w-4';
      break;
    case 'large':
      sizeClasses = 'h-12 w-12';
      break;
    case 'medium':
    default:
      sizeClasses = 'h-8 w-8';
  }
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <svg className={`animate-spin ${sizeClasses} text-blue-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center py-4">
      <svg className={`animate-spin ${sizeClasses} text-blue-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}

import { useEffect, useState } from "react";

export default function PageLayout({ children, title }) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setShow(true);
  }, []);
  
  return (
    <div className="bg-gray-50 min-h-full">
      <div className="py-6 transition-opacity duration-300 ease-in-out" style={{ opacity: show ? 1 : 0 }}>
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          <div className="h-1 w-20 bg-blue-500 rounded"></div>
        </div>
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

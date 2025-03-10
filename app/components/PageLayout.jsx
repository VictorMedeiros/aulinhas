import { useEffect, useState } from "react";

export default function PageLayout({ children, title }) {
  return (
    <div className="bg-gray-50 min-h-full">
      <div className="py-6">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

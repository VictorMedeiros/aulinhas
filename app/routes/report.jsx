import { useState } from 'react';
import { useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { prisma } from '~/util/db.server';
import MonthlyReportModal from '~/components/MonthlyReportModal';

export const loader = async () => {
  // Fetch all classes with student information
  const classes = await prisma.class.findMany({
    include: {
      student: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  return json({ classes });
};

export default function Report() {
  const { classes } = useLoaderData();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group classes by month
  const groupedByMonth = classes.reduce((acc, classItem) => {
    const date = new Date(classItem.date);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const displayName = `${monthName} ${year}`;

    if (!acc[monthYear]) {
      acc[monthYear] = {
        id: monthYear,
        displayName,
        classes: [],
        total: 0,
      };
    }

    // Use class-specific rate if available, otherwise use student's default rate
    const rate = classItem.lessonRate || classItem.student.lessonRate;
    acc[monthYear].classes.push(classItem);
    acc[monthYear].total += rate;

    return acc;
  }, {});

  // Convert to array and sort by date (latest first)
  const monthlyReports = Object.values(groupedByMonth).sort(
    (a, b) => b.id.localeCompare(a.id)
  );

  const openMonthDetails = (month) => {
    setSelectedMonth(month);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Monthly Income Reports</h1>
      
      {monthlyReports.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded">
          <p className="text-gray-600">No class data available to generate reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyReports.map((month) => (
            <div 
              key={month.id} 
              className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openMonthDetails(month)}
            >
              <h2 className="text-xl font-semibold text-gray-800">{month.displayName}</h2>
              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm text-gray-600">{month.classes.length} classes</div>
                <div className="text-xl font-bold text-green-600">${month.total}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedMonth && (
        <MonthlyReportModal
          month={selectedMonth}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
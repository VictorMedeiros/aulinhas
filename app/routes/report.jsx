import { useState } from 'react';
import { useLoaderData, useNavigation } from '@remix-run/react';
import { json } from '@remix-run/node';
import { prisma } from '~/util/db.server';
import MonthlyReportModal from '~/components/MonthlyReportModal';
import { requireAuth } from '~/services/auth.server';
import PageLayout from '~/components/PageLayout';
import LoadingIndicator from '~/components/LoadingIndicator';

export const loader = async ({ request }) => {
  // Require authentication and get the user
  const user = await requireAuth(request);
  
  // Fetch all classes with student information for the authenticated user
  const classes = await prisma.class.findMany({
    include: {
      student: true,
    },
    where: {
      student: {
        userId: user.id
      }
    },
    orderBy: {
      date: 'asc',
    },
  });

  return json({ classes, user });
};

export default function Report() {
  const { classes } = useLoaderData();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

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
    <PageLayout title="Monthly Income Reports">
      {isLoading ? (
        <LoadingIndicator size="large" />
      ) : monthlyReports.length === 0 ? (
        <div className="mt-6 bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No class data available to generate reports.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlyReports.map((month) => (
            <div 
              key={month.id} 
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openMonthDetails(month)}
            >
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">{month.displayName}</h3>
              </div>
              <div className="px-6 py-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">{month.classes.length} classes</div>
                <div className="text-2xl font-semibold text-green-600">${month.total}</div>
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
    </PageLayout>
  );
}
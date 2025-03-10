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
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600">No class data available to generate reports.</p>
          <p className="text-sm text-gray-500 mt-2">Add classes to see monthly income reports.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlyReports.map((month) => (
            <div 
              key={month.id} 
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 cursor-pointer hover:shadow-md transition-shadow transform hover:-translate-y-1 duration-200"
              onClick={() => openMonthDetails(month)}
            >
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {month.displayName}
                </h3>
              </div>
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {month.classes.length} classes
                  </div>
                  <div className="text-2xl font-semibold text-green-600 flex items-center">
                    <svg className="h-5 w-5 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    ${month.total}
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 flex justify-end">
                <span className="text-xs font-medium text-blue-600 flex items-center">
                  View Details 
                  <svg className="h-3 w-3 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
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
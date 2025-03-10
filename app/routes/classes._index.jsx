import { useLoaderData, useFetcher, useNavigate, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/util/db.server";
import { useState, useEffect } from "react";
import ConfirmationModal from "~/components/ConfirmationModal";
import ClassModal from "~/components/ClassModal";
import { requireAuth } from "~/services/auth.server";
import PageLayout from "~/components/PageLayout";
import LoadingIndicator from "~/components/LoadingIndicator";
import { useToast } from "~/components/ToastProvider";

export const loader = async ({ request }) => {
  // Require authentication and get the user
  const user = await requireAuth(request);
  
  // Fetch classes for students that belong to the authenticated user
  const [classes, students] = await Promise.all([
    prisma.class.findMany({
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
    }),
    prisma.student.findMany({
      where: {
        userId: user.id
      }
    }),
  ]);

  return json({ classes, students, user });
};

export const action = async ({ request }) => {
  // Require authentication and get the user
  const user = await requireAuth(request);
  
  const form = await request.formData();
  const actionType = form.get("actionType");
  
  // Handle delete operation
  if (actionType === "delete" || form.has("deleteId")) {
    const deleteId = form.get("deleteId") || form.get("classId");
    if (typeof deleteId === "string") {
      // Verify the class belongs to a student owned by the user
      const classItem = await prisma.class.findUnique({
        where: { id: deleteId },
        include: { student: true }
      });
      
      if (!classItem || classItem.student.userId !== user.id) {
        return json({ success: false, error: "Unauthorized" }, { status: 403 });
      }
      
      await prisma.class.delete({ where: { id: deleteId } });
      return json({ success: true });
    }
  }
  
  // Handle create operation
  else if (actionType === "create") {
    const studentId = form.get("studentId");
    const date = form.get("date");
    const time = form.get("time");
    const lessonRate = form.get("lessonRate") ? parseInt(form.get("lessonRate"), 10) : null;
    
    if (typeof studentId !== "string" || typeof date !== "string" || typeof time !== "string") {
      return json({ success: false, error: "Invalid data." }, { status: 400 });
    }

    // Verify student belongs to user
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true }
    });
    
    if (!student || student.userId !== user.id) {
      return json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
      // Split date and time into components
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const dateObj = new Date(year, month - 1, day, hours, minutes, 0);
      
      const newClass = await prisma.class.create({
        data: { 
          studentId, 
          date: dateObj,
          lessonRate
        },
      });
      
      return json({ success: true, class: newClass });
    } catch (error) {
      console.error("Error creating class:", error);
      return json({ 
        success: false, 
        error: "Failed to create class" 
      }, { status: 500 });
    }
  }
  
  // Handle update operation
  else if (actionType === "update") {
    const classId = form.get("classId");
    const studentId = form.get("studentId");
    const date = form.get("date");
    const time = form.get("time");
    const lessonRate = form.get("lessonRate") ? parseInt(form.get("lessonRate"), 10) : null;
    
    if (typeof classId !== "string" || typeof studentId !== "string" || 
        typeof date !== "string" || typeof time !== "string") {
      return json({ success: false, error: "Invalid data." }, { status: 400 });
    }

    // Verify both class and student belong to user
    const [classItem, student] = await Promise.all([
      prisma.class.findUnique({
        where: { id: classId },
        include: { student: { select: { userId: true } } }
      }),
      prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true }
      })
    ]);
    
    if (!classItem || classItem.student.userId !== user.id || 
        !student || student.userId !== user.id) {
      return json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const dateObj = new Date(year, month - 1, day, hours, minutes, 0);
      
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: { 
          studentId, 
          date: dateObj,
          lessonRate
        },
      });
      
      return json({ success: true, class: updatedClass });
    } catch (error) {
      console.error("Error updating class:", error);
      return json({ 
        success: false, 
        error: "Failed to update class" 
      }, { status: 500 });
    }
  }
  
  return redirect("/classes");
};

export default function ClassesIndex() {
  const { classes, students } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const toast = useToast();
  const isLoading = navigation.state === "loading";
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    classId: null
  });

  useEffect(() => {
    if (fetcher.state === "idle" && isRefreshing) {
      // Check if we got data back from the fetcher
      if (fetcher.data) {
        if (fetcher.data.success) {
          const action = fetcher.form?.get("actionType") === "create" ? "created" : 
                        fetcher.form?.get("actionType") === "update" ? "updated" : "deleted";
          toast?.success(`Class successfully ${action}!`);
        } else if (fetcher.data.error) {
          toast?.error(fetcher.data.error);
        }
      }
      
      // Clear the refreshing state and revalidate data
      setIsRefreshing(false);
      navigate("/classes", { replace: true });
    }
  }, [fetcher.state, fetcher.data, fetcher.form, isRefreshing, navigate, toast]);

  const handleDelete = (classId) => {
    setDeleteConfirmation({
      isOpen: true,
      classId: classId
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.classId) {
      setIsRefreshing(true);
      fetcher.submit(
        { actionType: "delete", classId: deleteConfirmation.classId }, 
        { method: "post" }
      );
      setDeleteConfirmation({ isOpen: false, classId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, classId: null });
  };

  // Update openClassModal to always open in edit mode:
  const openClassModal = (classItem) => {
    setSelectedClass(classItem);
    setIsEditMode(true); // Always open in editing mode so form controls are shown
    setIsModalOpen(true);
  };

  // Add a new delete handler for deletion from the modal
  const handleDeleteFromModal = () => {
    if (selectedClass && window.confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      setIsRefreshing(true);
      fetcher.submit(
        { actionType: "delete", classId: selectedClass.id },
        { method: "post" }
      );
      setIsModalOpen(false);
    }
  };

  const handleClassUpdated = () => {
    setIsModalOpen(false);
    setIsNewClassModalOpen(false);
    setIsRefreshing(true);
  };

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg flex flex-col items-center">
        <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg">Refreshing data...</p>
      </div>
    </div>
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Format as DD/MM/YYYY HH:mm
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <PageLayout title="Classes">
      {isRefreshing && <LoadingIndicator fullScreen={true} />}
      
      {isLoading ? (
        <LoadingIndicator size="large" />
      ) : (
        <>
          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg transition-all duration-200 hover:shadow-md">
            {classes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No classes found. Add your first class using the button below.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {classes.map((classItem) => (
                  <li 
                    key={classItem.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openClassModal(classItem)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-lg text-gray-900">{classItem.student.name}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 mr-1 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {formatDate(classItem.date)}
                        </p>
                        {classItem.lessonRate && classItem.lessonRate !== classItem.student.lessonRate && (
                          <p className="text-sm text-blue-600 mt-1 flex items-center">
                            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            Custom Rate: ${classItem.lessonRate}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700 transition-colors flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClassModal(classItem, true);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 transition-colors flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(classItem.id);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="mt-6">
            <button 
              onClick={() => setIsNewClassModalOpen(true)} 
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Class
            </button>
          </div>
          
          {/* Modals remain the same */}
          {selectedClass && (
            <ClassModal
              classItem={selectedClass}
              students={students}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleClassUpdated}
              isEditing={true}
              onDelete={handleDeleteFromModal}  // Pass the new deletion callback
            />
          )}
          
          <ClassModal
            students={students}
            isOpen={isNewClassModalOpen}
            onClose={() => setIsNewClassModalOpen(false)}
            onSave={handleClassUpdated}
            isNew={true}
          />
          
          <ConfirmationModal 
            isOpen={deleteConfirmation.isOpen}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
            title="Delete Class"
            message="Are you sure you want to delete this class? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />
        </>
      )}
    </PageLayout>
  );
}

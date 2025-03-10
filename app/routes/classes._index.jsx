import { useLoaderData, useFetcher, useNavigate, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/util/db.server";
import { useState, useEffect } from "react";
import ConfirmationModal from "~/components/ConfirmationModal";
import ClassModal from "~/components/ClassModal";
import { requireAuth } from "~/services/auth.server";
import PageLayout from "~/components/PageLayout";
import LoadingIndicator from "~/components/LoadingIndicator";

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
      navigate("/classes", { replace: true });
      setIsRefreshing(false);
    }
  }, [fetcher.state, isRefreshing, navigate]);

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

  const openClassModal = (classItem, editMode = false) => {
    setSelectedClass(classItem);
    setIsEditMode(editMode);
    setIsModalOpen(true);
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
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {classes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No classes found. Add your first class using the button below.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {classes.map((classItem) => (
                  <li 
                    key={classItem.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openClassModal(classItem)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-lg">{classItem.student.name}</p>
                        <p className="text-sm text-gray-600">{formatDate(classItem.date)}</p>
                        {classItem.lessonRate && classItem.lessonRate !== classItem.student.lessonRate && (
                          <p className="text-sm text-blue-600 mt-1">
                            Custom Rate: ${classItem.lessonRate}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-blue-500 hover:underline mr-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClassModal(classItem, true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-red-500 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(classItem.id);
                          }}
                        >
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
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              isEditing={isEditMode}
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

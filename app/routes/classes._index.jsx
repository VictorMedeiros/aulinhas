import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/util/db.server";
import { useState, useEffect } from "react";
import ConfirmationModal from "~/components/ConfirmationModal";
import ClassModal from "~/components/ClassModal";

export const loader = async () => {
  const [classes, students] = await Promise.all([
    prisma.class.findMany({
      include: {
        student: true,
      },
      orderBy: {
        date: 'asc', // Changed from 'desc' to 'asc' to show classes in ascending order by time
      },
    }),
    prisma.student.findMany(),
  ]);

  return json({ classes, students });
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const actionType = form.get("actionType");
  
  console.log("Action type:", actionType); // Add logging for debugging
  
  // Handle delete operation
  if (actionType === "delete" || form.has("deleteId")) {
    const deleteId = form.get("deleteId") || form.get("classId");
    if (typeof deleteId === "string") {
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

    console.log("SERVER - Creating class - Raw form data:", { studentId, date, time, lessonRate });
    console.log("SERVER - Creating class - Server datetime:", new Date().toString());
    
    if (typeof studentId !== "string" || typeof date !== "string" || typeof time !== "string") {
      return json({ success: false, error: "Invalid data." }, { status: 400 });
    }

    try {
      // Split date and time into components
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      
      console.log("SERVER - Date components:", { year, month, day, hours, minutes });
      
      // Create a date with both date and time components
      const dateObj = new Date(year, month - 1, day, hours, minutes, 0);
      console.log("SERVER - Final datetime being sent to DB:", dateObj.toString());
      console.log("SERVER - Final datetime ISO string:", dateObj.toISOString());
      
      const newClass = await prisma.class.create({
        data: { 
          studentId, 
          date: dateObj,
          lessonRate // Add the lessonRate to the class creation
        },
      });
      
      console.log("SERVER - Class created in DB:", newClass);
      console.log("SERVER - Datetime stored in DB:", new Date(newClass.date).toString());
      
      return json({ success: true, class: newClass });
    } catch (error) {
      console.error("Error creating class:", error); // Add error logging
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

    console.log("SERVER - Updating class - Raw form data:", { classId, studentId, date, time, lessonRate });
    console.log("SERVER - Updating class - Server datetime:", new Date().toString());
    
    if (typeof classId !== "string" || typeof studentId !== "string" || 
        typeof date !== "string" || typeof time !== "string") {
      return json({ success: false, error: "Invalid data." }, { status: 400 });
    }

    try {
      // Split date and time into components
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      
      console.log("SERVER - Date components:", { year, month, day, hours, minutes });
      
      // Create a date with both date and time components
      const dateObj = new Date(year, month - 1, day, hours, minutes, 0);
      console.log("SERVER - Final datetime being sent to DB:", dateObj.toString());
      console.log("SERVER - Final datetime ISO string:", dateObj.toISOString());
      
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: { 
          studentId, 
          date: dateObj,
          lessonRate // Add the lessonRate to the class update
        },
      });
      
      console.log("SERVER - Class updated in DB:", updatedClass);
      console.log("SERVER - Datetime stored in DB:", new Date(updatedClass.date).toString());
      
      return json({ success: true, class: updatedClass });
    } catch (error) {
      console.error("Error updating class:", error); // Add error logging
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
    <>
      {isRefreshing && <LoadingOverlay />}
      
      <ul className="mt-4">
        {classes.map((classItem) => (
          <li 
            key={classItem.id}
            className="p-4 bg-white rounded shadow hover:shadow-lg transition-shadow flex justify-between items-center mb-4"
          >
            <div 
              className="flex-grow cursor-pointer" 
              onClick={() => openClassModal(classItem)}
            >
              <p className="font-semibold text-lg">{classItem.student.name}</p>
              <p className="text-sm text-gray-600">{formatDate(classItem.date)}</p>
              {classItem.lessonRate && classItem.lessonRate !== classItem.student.lessonRate && (
                <p className="text-sm text-blue-500">
                  Custom Rate: {classItem.lessonRate}
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
          </li>
        ))}
      </ul>
      
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
      
      <button 
        onClick={() => setIsNewClassModalOpen(true)} 
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add Class
      </button>
    </>
  );
}

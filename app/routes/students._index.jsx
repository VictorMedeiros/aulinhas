// app/routes/students.jsx
import { useLoaderData, Link, useFetcher, useNavigate, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/util/db.server";
import { useState, useEffect } from "react";
import StudentModal from "~/components/StudentModal";
import ConfirmationModal from "~/components/ConfirmationModal";
import { requireAuth } from "~/services/auth.server";
import PageLayout from "~/components/PageLayout";
import LoadingIndicator from "~/components/LoadingIndicator";
import { useToast } from "~/components/ToastProvider";
import ClassModal from "~/components/ClassModal";

export const loader = async ({ request }) => {
  // Require authentication and get the user
  const user = await requireAuth(request);
  
  // Fetch only students belonging to the authenticated user
  const students = await prisma.student.findMany({
    where: {
      userId: user.id
    },
    include: {
      classes: {
        orderBy: {
          date: 'asc'
        }
      }
    }
  });
  return json({ students, user });
};

export const action = async ({ request }) => {
  // Require authentication and get the user
  const user = await requireAuth(request);
  const form = await request.formData();
  const actionType = form.get("actionType");
  
  // Handle delete operation
  if (actionType === "delete" || form.has("deleteId")) {
    const deleteId = form.get("deleteId") || form.get("studentId");
    if (typeof deleteId === "string") {
      // Ensure the student belongs to the authenticated user
      const student = await prisma.student.findUnique({
        where: { id: deleteId },
        select: { userId: true }
      });
      
      if (!student || student.userId !== user.id) {
        return json({ success: false, error: "Unauthorized" }, { status: 403 });
      }
      
      await prisma.student.delete({ where: { id: deleteId } });
      return json({ success: true });
    }
  }
  
  // Handle create operation
  else if (actionType === "create") {
    const name = form.get("name");
    const lessonRate = form.get("lessonRate");
    const age = form.get("age");

    if (typeof name !== "string" || typeof lessonRate !== "string") {
      return json({ success: false, error: "Invalid data." }, { status: 400 });
    }

    try {
      const newStudent = await prisma.student.create({
        data: { 
          name, 
          lessonRate: parseInt(lessonRate), 
          age: age ? parseInt(age) : null,
          userId: user.id // Associate with the authenticated user
        },
      });
      return json({ success: true, student: newStudent });
    } catch (error) {
      return json({ 
        success: false, 
        error: "Failed to create student" 
      }, { status: 500 });
    }
  }
  
  // Handle update operation
  else if (actionType === "update") {
    const studentId = form.get("studentId");
    const name = form.get("name");
    const lessonRate = form.get("lessonRate");
    const age = form.get("age");

    if (typeof studentId !== "string" || typeof name !== "string" || typeof lessonRate !== "string") {
      return json({ success: false, error: "Invalid data." }, { status: 400 });
    }

    // Verify ownership of the student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true }
    });
    
    if (!student || student.userId !== user.id) {
      return json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: { 
          name, 
          lessonRate: parseInt(lessonRate), 
          age: age ? parseInt(age) : null
        },
      });
      return json({ success: true, student: updatedStudent });
    } catch (error) {
      return json({ 
        success: false, 
        error: "Failed to update student" 
      }, { status: 500 });
    }
  }
  
  return redirect("/students");
};

export default function StudentsIndex() {
  const { students } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const toast = useToast();
  const isLoading = navigation.state === "loading";
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    studentId: null
  });
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedStudentForClass, setSelectedStudentForClass] = useState(null);

  useEffect(() => {
    if (fetcher.state === "idle" && isRefreshing) {
      // Check if we got data back from the fetcher
      if (fetcher.data) {
        if (fetcher.data.success) {
          // Show a success toast if the operation was successful
          const action = fetcher.form?.get("actionType") === "create" ? "created" : 
                        fetcher.form?.get("actionType") === "update" ? "updated" : "deleted";
          toast?.success(`Student successfully ${action}!`);
        } else if (fetcher.data.error) {
          toast?.error(fetcher.data.error);
        }
      }
      
      // Clear the refreshing state and revalidate data
      setIsRefreshing(false);
      navigate("/students", { replace: true });
    }
  }, [fetcher.state, fetcher.data, fetcher.form, isRefreshing, navigate, toast]);

  const handleDelete = (studentId) => {
    setDeleteConfirmation({
      isOpen: true,
      studentId: studentId
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.studentId) {
      setIsRefreshing(true);
      fetcher.submit(
        { actionType: "delete", studentId: deleteConfirmation.studentId }, 
        { method: "post" }
      );
      setDeleteConfirmation({ isOpen: false, studentId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, studentId: null });
  };

  const openStudentModal = (student, editMode = false) => {
    setSelectedStudent(student);
    setIsEditMode(editMode);
    setIsModalOpen(true);
  };

  const handleStudentUpdated = () => {
    setIsModalOpen(false);
    setIsNewStudentModalOpen(false);
    setIsRefreshing(true);
  };

  const openClassModal = (student) => {
    setSelectedStudentForClass(student)
    console.log("valor da variavel student", student)// teste
    setIsClassModalOpen(true);
  };

  return (
    <PageLayout title="Students">
      {isRefreshing && <LoadingIndicator fullScreen={true} />}
      
      {isLoading ? (
        <LoadingIndicator size="large" />
      ) : (
        <>
          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg transition-all duration-200 hover:shadow-md">
            {students.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>No students found. Add your first student using the button below.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {students.map((student) => (
                  <li 
                    key={student.id}
                    className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer transition-colors"
                    onClick={() => openStudentModal(student)}
                  >
                    <div>
                      <p className="font-semibold text-lg text-gray-900">{student.name} {student.age ? `(${student.age} years)` : ""}</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <svg className="h-4 w-4 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        Rate: ${student.lessonRate}
                      </p>
                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        {student.classes?.length || 0} classes
                        <button
                          type="button"
                          className="ml-2 text-green-500 hover:text-green-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClassModal(student);
                          }}
                        >
                          Add Class
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700 transition-colors flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStudentModal(student, true);
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
                          handleDelete(student.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Add student button with better positioning */}
          <div className="mt-6">
            <button 
              onClick={() => setIsNewStudentModalOpen(true)} 
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Student
            </button>
          </div>
          
          {/* Modals */}
          {selectedStudent && (
            <StudentModal
              student={selectedStudent}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleStudentUpdated}
              isEditing={isEditMode}
            />
          )}
          
          <StudentModal
            isOpen={isNewStudentModalOpen}
            onClose={() => setIsNewStudentModalOpen(false)}
            onSave={handleStudentUpdated}
            isNew={true}
          />
          
          <ConfirmationModal 
            isOpen={deleteConfirmation.isOpen}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
            title="Delete Student"
            message="Are you sure you want to delete this student? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />

          {selectedStudentForClass && (
                  <ClassModal
                    isOpen={isClassModalOpen}
                    onClose={() => setIsClassModalOpen(false)}
                    onSave={handleStudentUpdated}
                    students={selectedStudentForClass}
                    isNew={true}
                  />
          )}
        </>
      )}
    </PageLayout>
  );
}
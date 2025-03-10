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

  useEffect(() => {
    if (fetcher.state === "idle" && isRefreshing) {
      navigate("/students", { replace: true });
      setIsRefreshing(false);
    }
  }, [fetcher.state, isRefreshing, navigate]);

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

  return (
    <PageLayout title="Students">
      {isRefreshing && <LoadingIndicator fullScreen={true} />}
      
      {isLoading ? (
        <LoadingIndicator size="large" />
      ) : (
        <>
          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
            {students.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No students found. Add your first student using the button below.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {students.map((student) => (
                  <li 
                    key={student.id}
                    className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                    onClick={() => openStudentModal(student)}
                  >
                    <div>
                      <p className="font-semibold text-lg">{student.name} {student.age ? `(Idade: ${student.age})` : ""}</p>
                      <p className="text-sm text-gray-600">Lesson Rate: ${student.lessonRate}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-blue-500 hover:underline mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStudentModal(student, true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(student.id);
                        }}
                      >
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
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
        </>
      )}
    </PageLayout>
  );
}
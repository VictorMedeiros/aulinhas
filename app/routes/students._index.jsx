// app/routes/students.jsx
import { useLoaderData, Link, useFetcher, useNavigate } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/util/db.server";
import { useState, useEffect } from "react";
import StudentModal from "~/components/StudentModal";
import ConfirmationModal from "~/components/ConfirmationModal";

export const loader = async () => {
  const students = await prisma.student.findMany({
    include: {
      classes: {
        orderBy: {
          date: 'asc'
        }
      }
    }
  });
  return json({ students });
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const actionType = form.get("actionType");
  
  // Handle delete operation
  if (actionType === "delete" || form.has("deleteId")) {
    const deleteId = form.get("deleteId") || form.get("studentId");
    if (typeof deleteId === "string") {
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
        data: { name, lessonRate: parseInt(lessonRate), age: age ? parseInt(age) : null },
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

  return (
    <>
      {isRefreshing && <LoadingOverlay />}
      
      <ul className="mt-4">
        {students.map((student) => (
          <li 
            key={student.id}
            className="p-4 bg-white rounded shadow hover:shadow-lg transition-shadow flex justify-between items-center mb-4"
          >
            <div 
              className="flex-grow cursor-pointer" 
              onClick={() => openStudentModal(student)}
            >
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
      
      <button 
        onClick={() => setIsNewStudentModalOpen(true)} 
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add Student
      </button>
    </>
  );
}
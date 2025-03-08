// app/routes/students.jsx
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/util/db.server";

export const loader = async () => {
  const students = await prisma.student.findMany();
  return json({ students });
};

export const action = async ({ request }) => {
  const form = await request.formData();
  const deleteId = form.get("deleteId");
  if (typeof deleteId === "string") {
    await prisma.student.delete({ where: { id: deleteId } });
  }
  return redirect("/students");
};

export default function StudentsIndex() {
  const { students } = useLoaderData();
  const fetcher = useFetcher();

  const handleDelete = (studentId) => {
    const confirmed = window.confirm("Are you sure you want to delete this student?");
    if (confirmed) {
      fetcher.submit({ deleteId: studentId }, { method: "post" });
    }
  };

  return (
    <>
      <ul className="mt-4">
        {students.map((student) => (
          <li key={student.id}
            className="p-4 bg-white rounded shadow hover:shadow-lg transition-shadow flex justify-between items-center mb-4">
            <div>
              <p className="font-semibold text-lg">{student.name}</p>
              <p className="text-sm text-gray-600">Lesson Rate: {student.lessonRate}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/students/${student.id}/edit`} className="text-blue-500 hover:underline">
                Edit
              </Link>
              <button
                type="button"
                className="text-red-500 hover:underline"
                onClick={() => handleDelete(student.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/students/new" className="bg-blue-500 text-white px-4 py-2 rounded">
        Add Student
      </Link>
    </>
  );
}
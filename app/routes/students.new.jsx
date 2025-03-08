// app/routes/students/new.jsx
import { redirect } from "@remix-run/node";
import { Form, useActionData, Link } from "@remix-run/react";
import { prisma } from "~/util/db.server";

export const action = async ({ request }) => {
  const form = await request.formData();
  const name = form.get("name");
  const lessonRate = form.get("lessonRate");

  if (typeof name !== "string" || typeof lessonRate !== "string") {
    return { error: "Invalid data." };
  }

  await prisma.student.create({
    data: { name, lessonRate: parseInt(lessonRate) },
  });

  return redirect("/students");
};

export default function NewStudent() {
  console.log('export default function NewStudent()');
  const actionData = useActionData();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add New Student</h1>
      {actionData?.error && (
        <p className="text-red-500">{actionData.error}</p>
      )}
      <Form method="post">
        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input
            type="text"
            name="name"
            className="w-full border px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Lesson Rate</label>
          <input
            type="number"
            name="lessonRate"
            step="0.01"
            className="w-full border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Student
        </button>
      </Form>
      <Link to="/students" className="text-blue-500 mt-4 inline-block">
        Back to Students
      </Link>
    </div>
  );
}

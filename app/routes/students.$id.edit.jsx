import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData, Link } from "@remix-run/react";
import { prisma } from "~/util/db.server";

export const loader = async ({ params }) => {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
  });
  
  if (!student) {
    throw new Response("Not Found", { status: 404 });
  }
  
  return json({ student });
};

export const action = async ({ request, params }) => {
  const form = await request.formData();
  const name = form.get("name");
  const lessonRate = form.get("lessonRate");

  if (typeof name !== "string" || typeof lessonRate !== "string") {
    return { error: "Invalid data." };
  }

await prisma.student.update({
    where: { id: params.id },
    data: { name, lessonRate: parseInt(lessonRate, 10) },
});

  return redirect("/students");
};

export default function EditStudent() {
  const { student } = useLoaderData();
  const actionData = useActionData();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Student</h1>
      {actionData?.error && (
        <p className="text-red-500">{actionData.error}</p>
      )}
      <Form method="post">
        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input
            type="text"
            name="name"
            defaultValue={student.name}
            className="w-full border px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Lesson Rate</label>
          <input
            type="number"
            name="lessonRate"
            step="0.01"
            defaultValue={student.lessonRate}
            className="w-full border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Update Student
        </button>
      </Form>
      <Link to="/students" className="text-blue-500 mt-4 inline-block">
        Back to Students
      </Link>
    </div>
  );
}

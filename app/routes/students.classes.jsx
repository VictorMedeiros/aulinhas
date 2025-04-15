import { json } from "@remix-run/node";
import { prisma } from "~/util/db.server";
import { requireAuth } from "~/services/auth.server";

export async function loader({ request }) {
  const user = await requireAuth(request);
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const month = parseInt(url.searchParams.get("month"));
  const year = parseInt(url.searchParams.get("year"));

  if (!studentId || !month || !year) {
    return json({ error: "Missing required parameters" }, { status: 400 });
  }

  // Verify student belongs to user
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true }
  });

  if (!student || student.userId !== user.id) {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: {
      studentId,
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1)
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  return json({ classes });
}
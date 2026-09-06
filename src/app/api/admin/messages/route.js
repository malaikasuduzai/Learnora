import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const CAN_MANAGE_MESSAGES = ["SUPER_ADMIN", "ADMIN"];

const MESSAGE_SELECT = {
  id: true,
  name: true,
  email: true,
  subject: true,
  body: true,
  readAt: true,
  createdAt: true,
};

// GET /api/admin/messages?filter=unread&search=
// Powers the Contact Messages page — every submission from the landing
// page's contact form. `filter=unread` narrows to unread only; `search`
// matches against name, email or subject.
export async function GET(request) {
  const { error } = await requireRole(CAN_MANAGE_MESSAGES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");
  const search = searchParams.get("search")?.trim();

  const [messages, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where: {
        ...(filter === "unread" ? { readAt: null } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { subject: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: MESSAGE_SELECT,
    }),
    prisma.contactMessage.count({ where: { readAt: null } }),
  ]);

  return NextResponse.json({ messages, unreadCount });
}

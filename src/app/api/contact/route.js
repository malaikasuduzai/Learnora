import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactMessageSchema, flattenZodError } from "@/lib/validations";
import { notifyRoles } from "@/lib/notify";

// POST /api/contact — the landing page's "Talk to our team" form. No auth:
// a visitor filling this out may not have a Learnora account at all. On
// success, every Admin/Super Admin gets a notification so it surfaces the
// same way other admin-facing events do, in addition to the Contact
// Messages page itself.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { name, email, subject, body: messageBody } = parsed.data;

  const message = await prisma.contactMessage.create({
    data: { name, email, subject, body: messageBody },
  });

  await notifyRoles(["ADMIN"], {
    type: "CONTACT_MESSAGE",
    title: `New contact message from ${name}`,
    body: subject,
    link: "/admin/messages",
  });

  return NextResponse.json({ message: { id: message.id } }, { status: 201 });
}

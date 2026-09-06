import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { MailIcon } from "@/components/icons";
import ContactMessagesManager from "@/components/admin/ContactMessagesManager";

export default async function AdminMessagesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="admin"
          icon={MailIcon}
          title="Contact Messages"
          description="Submissions from the landing page's contact form."
        />
        <ContactMessagesManager />
      </div>
    </DashboardShell>
  );
}

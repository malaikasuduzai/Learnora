"use client";

import MessageThreadEnhanced from "@/components/MessageThreadEnhanced";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import { MessageIcon } from "@/components/icons";

export default function StudentMessagesEnhanced() {
  return (
    <div className="space-y-6">
      <StudentPageHeader
        icon={MessageIcon}
        title="Messages"
        description="Message the teacher of any course you're enrolled in. Get instant notifications and manage your preferences."
      />
      <MessageThreadEnhanced
        listUrl="/api/student/messages"
        threadUrl={(c) => `/api/student/messages/${c.courseId}`}
        messageUrl={(c, messageId) => `/api/student/messages/${c.courseId}/${messageId}`}
        conversationKey={(c) => c.courseId}
        otherPartyLabel={(c) => c.teacher.name}
        emptyTitle="Select a conversation"
        emptyBody="Pick a course from the list to message its teacher."
        noConversationsTitle="No conversations yet"
        noConversationsBody="Enroll in a course with an assigned teacher to start messaging them."
      />
    </div>
  );
}

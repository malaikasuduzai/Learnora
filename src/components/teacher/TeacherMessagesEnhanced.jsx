"use client";

import MessageThreadEnhanced from "@/components/MessageThreadEnhanced";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import { MessageIcon } from "@/components/icons";

export default function TeacherMessagesEnhanced() {
  return (
    <div className="space-y-6">
      <TeacherPageHeader
        icon={MessageIcon}
        title="Messages"
        description="Message students enrolled in your courses one on one. Manage notifications and track all conversations with enhanced features."
      />
      <MessageThreadEnhanced
        listUrl="/api/teacher/messages"
        threadUrl={(c) => `/api/teacher/messages/${c.courseId}/${c.student.id}`}
        messageUrl={(c, messageId) => `/api/teacher/messages/${c.courseId}/${c.student.id}/${messageId}`}
        conversationKey={(c) => `${c.courseId}:${c.student.id}`}
        otherPartyLabel={(c) => c.student.name}
        emptyTitle="Select a conversation"
        emptyBody="Pick a student from the list to see your message history."
        noConversationsTitle="No students yet"
        noConversationsBody="Once students are enrolled in one of your courses, you'll be able to message them here."
      />
    </div>
  );
}

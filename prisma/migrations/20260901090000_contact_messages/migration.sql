-- Admin Dashboard: Contact Messages (public landing-page contact form,
-- wired to the database so an Admin can actually receive and manage
-- submissions instead of the form being a static, unwired div).
-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('ENROLLMENT', 'LECTURE_ADDED', 'TASK_ASSIGNED', 'TASK_SUBMITTED', 'TASK_EVALUATED', 'ANNOUNCEMENT', 'MESSAGE', 'ATTENDANCE_REMINDER', 'CONTACT_MESSAGE') NOT NULL;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_messages_readAt_idx`(`readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

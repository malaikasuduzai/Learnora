-- Message edit/delete (PRD section 30) and attendance admin-unlock (edit
-- window past ATTENDANCE_EDIT_WINDOW_DAYS requires an Admin grant).

-- AlterTable
ALTER TABLE `messages`
  ADD COLUMN `editedAt` DATETIME(3) NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `attendance`
  ADD COLUMN `adminUnlockedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `courses` ADD COLUMN `attendanceWindowStart` VARCHAR(191) NULL,
    ADD COLUMN `attendanceWindowEnd` VARCHAR(191) NULL,
    ADD COLUMN `lateAllowed` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL DEFAULT 'PRESENT',
    `markedBy` ENUM('STUDENT', 'TEACHER') NOT NULL DEFAULT 'STUDENT',
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendance_courseId_idx`(`courseId`),
    INDEX `attendance_studentId_idx`(`studentId`),
    UNIQUE INDEX `attendance_courseId_studentId_date_key`(`courseId`, `studentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

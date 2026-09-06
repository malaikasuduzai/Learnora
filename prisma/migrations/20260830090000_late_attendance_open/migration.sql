-- Late attendance marking is no longer a per-course opt-in: every teacher
-- can mark a student Late from day one. Flip the column default and
-- backfill existing courses so this rolls out instantly for schools that
-- are already using the platform.
ALTER TABLE `courses` MODIFY `lateAllowed` BOOLEAN NOT NULL DEFAULT true;
UPDATE `courses` SET `lateAllowed` = true WHERE `lateAllowed` = false;

-- Add PUBLIC to EntryMethod enum (SHK-042 open/public-join access mode).
ALTER TYPE "EntryMethod" ADD VALUE IF NOT EXISTS 'PUBLIC';

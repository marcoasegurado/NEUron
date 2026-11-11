-- Phase 10: central read-only conversion table and dropped-subject status.
--
-- conversion_rows holds the single application-wide percentage-to-grade table.
-- It has no user_id or semester_id on purpose: every account and every semester
-- reads the same live table, and students cannot write to it. Rows are created
-- and changed only by owner tooling, because the official NEU thresholds are
-- still unverified and must not be invented in code.
--
-- This migration intentionally seeds no rows. Until the owner applies approved
-- thresholds, the table is empty and every subject grade stays pending.

CREATE TABLE IF NOT EXISTS conversion_rows (
  id TEXT PRIMARY KEY,
  minimum_percentage REAL NOT NULL
    CHECK (minimum_percentage >= 0 AND minimum_percentage <= 100),
  grade REAL NOT NULL CHECK (grade >= 1.0 AND grade <= 5.0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_rows_threshold
  ON conversion_rows (minimum_percentage);

-- A dropped subject keeps its categories, activities, and percentage, but
-- contributes no units and no grade to the semester GWA (GRADING_RULES.md §7).
ALTER TABLE subjects ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1
  CHECK (is_active IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_subjects_semester_active
  ON subjects (semester_id, is_active);

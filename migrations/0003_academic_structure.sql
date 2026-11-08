CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_semesters_user_id ON semesters (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_user_term
  ON semesters (user_id, academic_year COLLATE NOCASE, term COLLATE NOCASE);
CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_one_active
  ON semesters (user_id) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  semester_id TEXT NOT NULL,
  name TEXT NOT NULL,
  units REAL NOT NULL CHECK (units > 0),
  professor TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (semester_id) REFERENCES semesters (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subjects_semester_id ON subjects (semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_sort_order
  ON subjects (semester_id, sort_order);

CREATE TABLE IF NOT EXISTS grading_categories (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  weight_percent REAL NOT NULL CHECK (weight_percent > 0 AND weight_percent <= 100),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_grading_categories_subject_id
  ON grading_categories (subject_id);
CREATE INDEX IF NOT EXISTS idx_grading_categories_sort_order
  ON grading_categories (subject_id, sort_order);

CREATE TABLE IF NOT EXISTS class_schedules (
  id TEXT PRIMARY KEY,
  semester_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (start_time < end_time),
  FOREIGN KEY (semester_id) REFERENCES semesters (id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_class_schedules_semester_day
  ON class_schedules (semester_id, day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_class_schedules_subject_id
  ON class_schedules (subject_id);

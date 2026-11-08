CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  score_earned REAL NOT NULL CHECK (score_earned >= 0),
  total_points REAL NOT NULL CHECK (total_points > 0),
  activity_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (score_earned <= total_points),
  FOREIGN KEY (category_id) REFERENCES grading_categories (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_category_id
  ON activities (category_id);
CREATE INDEX IF NOT EXISTS idx_activities_category_date
  ON activities (category_id, activity_date);

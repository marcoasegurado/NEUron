-- Phase 13: public demo access, self-registration with owner approval, and
-- owner-only account administration.
--
-- Existing rows keep working: every current account becomes `active` and a
-- `student`, and no row is marked as the shared demo account. The owner
-- promotes their own account with `npm run cf:account:promote`, and the demo
-- account is created by `npm run cf:demo:reset`.
--
-- `status` decides whether an account can sign in. `pending` accounts are
-- created by registration and cannot log in until the owner approves them.
-- `rejected` accounts stay stored so the same email/username is not silently
-- reusable, and they also cannot sign in.
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'pending', 'rejected'));

-- `role` controls access to owner-only APIs. Only the owner can approve or
-- reject account requests.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'
  CHECK (role IN ('student', 'owner'));

-- Exactly one row may be the shared demo account. The partial unique index
-- keeps the flag truthful while allowing every other row to stay at 0.
ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0
  CHECK (is_demo IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_one_demo
  ON users (is_demo) WHERE is_demo = 1;

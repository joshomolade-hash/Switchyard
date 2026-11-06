-- Switchyard diagram storage: one row per diagram, scoped to the signed-in user.
CREATE TABLE IF NOT EXISTS diagrams (
  user        TEXT    NOT NULL,
  id          TEXT    NOT NULL,
  title       TEXT    NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  nodes       INTEGER NOT NULL DEFAULT 0,
  edges       INTEGER NOT NULL DEFAULT 0,
  thumb       TEXT    NOT NULL DEFAULT '',
  body        TEXT    NOT NULL,
  PRIMARY KEY (user, id)
);
CREATE INDEX IF NOT EXISTS diagrams_by_user_updated ON diagrams (user, updated_at DESC);

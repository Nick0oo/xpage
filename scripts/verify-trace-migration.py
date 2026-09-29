"""SQLite regression check for trace history migration and concurrent ordering."""

import concurrent.futures
import sqlite3
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "prisma/migrations/20260928100000_trace_event_contract/migration.sql"


class TraceMigrationTest(unittest.TestCase):
    def test_keeps_historical_records_and_allocates_unique_concurrent_sequences(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "history.db"
            db = sqlite3.connect(path)
            db.executescript(
                """
                CREATE TABLE GenerationTrace (
                  id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL,
                  contextJson TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
                  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL
                );
                CREATE TABLE GenerationTraceStep (
                  id TEXT PRIMARY KEY, traceId TEXT NOT NULL, sequence INTEGER NOT NULL,
                  phase TEXT NOT NULL, title TEXT NOT NULL, techniqueIdsJson TEXT, provider TEXT,
                  model TEXT, systemPrompt TEXT, userPrompt TEXT, outputText TEXT, outputJson TEXT,
                  status TEXT NOT NULL DEFAULT 'completed', errorMessage TEXT, durationMs INTEGER,
                  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(traceId) REFERENCES GenerationTrace(id) ON DELETE CASCADE
                );
                INSERT INTO GenerationTrace(id, category, title, contextJson, createdAt, updatedAt)
                  VALUES ('trace-old', 'landing-page', 'Histórica', '{"brief":"original"}', '2025-01-01', '2025-01-02');
                INSERT INTO GenerationTraceStep(id, traceId, sequence, phase, title, outputJson)
                  VALUES ('step-old', 'trace-old', 1, 'landing-generation', 'Construcción', '{"html":"legacy"}');
                """
            )
            db.executescript(MIGRATION.read_text(encoding="utf-8-sig"))
            legacy = db.execute(
                "SELECT rootTraceId, executionId, sequenceCounter FROM GenerationTrace WHERE id='trace-old'"
            ).fetchone()
            self.assertEqual(legacy, ("trace-old", "trace-old", 1))
            self.assertEqual(
                db.execute("SELECT outputJson FROM GenerationTraceStep WHERE id='step-old'").fetchone()[0],
                '{"html":"legacy"}',
            )

            def write_event(_):
                connection = sqlite3.connect(path, timeout=20)
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    "UPDATE GenerationTrace SET sequenceCounter=sequenceCounter+1 WHERE id='trace-old'"
                )
                sequence = connection.execute(
                    "SELECT sequenceCounter FROM GenerationTrace WHERE id='trace-old'"
                ).fetchone()[0]
                connection.execute(
                    "INSERT INTO GenerationTraceStep(id, traceId, sequence, executionId, rootTraceId, phase, title) "
                    "VALUES (?, 'trace-old', ?, 'trace-old', 'trace-old', 'revision', 'Test concurrente')",
                    (f"new-{sequence}", sequence),
                )
                connection.commit()
                connection.close()
                return sequence

            db.close()
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                sequences = list(pool.map(write_event, range(32)))
            self.assertEqual(sorted(sequences), list(range(2, 34)))


if __name__ == "__main__":
    unittest.main()

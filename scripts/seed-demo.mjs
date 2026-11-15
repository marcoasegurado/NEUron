import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { stdout } from 'node:process'
import { pathToFileURL } from 'node:url'
import { hashPassword } from './create-account.mjs'

const require = createRequire(import.meta.url)
const wranglerBin = join(
  dirname(require.resolve('wrangler/package.json')),
  'bin',
  'wrangler.js',
)

const DEMO_USER_ID = 'demo-user'
const DEMO_EMAIL = 'demo@neuming.local'
const DEMO_USERNAME = 'demo'
const DEMO_DISPLAY_NAME = 'Demo Student'

const SUBJECTS = [
  {
    id: 'demo-subject-dsa',
    name: 'Data Structures & Algorithms',
    units: 3,
    professor: 'Dr. Reyes',
    categories: [
      {
        id: 'demo-category-dsa-quizzes',
        name: 'Quizzes',
        weight: 30,
        activities: [
          ['Quiz 1', 18, 20, '2026-08-19'],
          ['Quiz 2', 22, 25, '2026-09-09'],
        ],
      },
      {
        id: 'demo-category-dsa-mp',
        name: 'Machine Problems',
        weight: 40,
        activities: [
          ['Machine Problem 1', 45, 50, '2026-09-18'],
          ['Machine Problem 2', 38, 40, '2026-10-02'],
        ],
      },
      {
        id: 'demo-category-dsa-final',
        name: 'Final Exam',
        weight: 30,
        activities: [['Final Exam', 82, 100, '2026-10-20']],
      },
    ],
    classes: [
      [1, '08:00', '09:30', 'Room 301'],
      [3, '08:00', '09:30', 'Room 301'],
    ],
  },
  {
    id: 'demo-subject-discrete',
    name: 'Discrete Mathematics',
    units: 3,
    professor: 'Prof. Santos',
    categories: [
      {
        id: 'demo-category-discrete-quizzes',
        name: 'Quizzes',
        weight: 30,
        activities: [
          ['Quiz 1', 21, 25, '2026-08-21'],
          ['Quiz 2', 19, 20, '2026-09-11'],
        ],
      },
      {
        id: 'demo-category-discrete-assignments',
        name: 'Assignments',
        weight: 30,
        activities: [['Assignment 1', 28, 30, '2026-09-25']],
      },
      {
        id: 'demo-category-discrete-final',
        name: 'Final Exam',
        weight: 40,
        activities: [['Final Exam', 88, 100, '2026-10-21']],
      },
    ],
    classes: [
      [2, '10:00', '11:30', 'Room 205'],
      [4, '10:00', '11:30', 'Room 205'],
    ],
  },
  {
    id: 'demo-subject-org',
    name: 'Computer Organization',
    units: 3,
    professor: 'Engr. Cruz',
    categories: [
      {
        id: 'demo-category-org-quizzes',
        name: 'Quizzes',
        weight: 25,
        activities: [['Quiz 1', 17, 20, '2026-08-20']],
      },
      {
        id: 'demo-category-org-labs',
        name: 'Laboratory',
        weight: 45,
        activities: [
          ['Lab 1', 40, 50, '2026-09-04'],
          ['Lab 2', 46, 50, '2026-09-18'],
        ],
      },
      {
        id: 'demo-category-org-final',
        name: 'Final Exam',
        weight: 30,
        activities: [['Final Exam', 78, 100, '2026-10-22']],
      },
    ],
    classes: [
      [1, '13:00', '14:30', 'Lab 2'],
      [5, '13:00', '14:30', 'Lab 2'],
    ],
  },
  {
    id: 'demo-subject-writing',
    name: 'Technical Writing',
    units: 2,
    professor: 'Ms. Lim',
    categories: [
      {
        id: 'demo-category-writing-papers',
        name: 'Papers',
        weight: 60,
        activities: [['Paper 1', 45, 50, '2026-09-15']],
      },
      {
        id: 'demo-category-writing-final',
        name: 'Final Exam',
        weight: 40,
        activities: [['Final Exam', 88, 100, '2026-10-23']],
      },
    ],
    classes: [[2, '15:00', '16:00', 'Room 110']],
  },
]

function usage() {
  stdout.write(
    [
      'Usage:',
      '  npm run cf:demo:reset -- [--local]',
      '',
      'Creates or replaces the shared demo account and its sample semester.',
      'The demo login is one-click in the app; no password is printed or needed.',
      '',
      'Options:',
      '  --local  Target the local D1 database instead of remote.',
      '',
      'The demo account is intentionally writable. Run this command again to',
      'restore the sample data after visitors change it.',
      '',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const args = { local: false }
  for (const arg of argv) {
    if (arg === '--local') {
      args.local = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function sqlValue(value) {
  return typeof value === 'number' ? String(value) : sqlString(value)
}

function deleteSql() {
  const demoUsers =
    "(SELECT id FROM users WHERE is_demo = 1 OR id = 'demo-user')"
  const demoSubjects = `(SELECT s.id FROM subjects s
     JOIN semesters m ON m.id = s.semester_id
     WHERE m.user_id IN ${demoUsers})`
  const demoCategories = `(SELECT c.id FROM grading_categories c
     JOIN subjects s ON s.id = c.subject_id
     WHERE s.semester_id IN (
       SELECT m.id FROM semesters m WHERE m.user_id IN ${demoUsers}
     ))`

  return [
    `DELETE FROM activities WHERE category_id IN ${demoCategories};`,
    `DELETE FROM grading_categories WHERE subject_id IN ${demoSubjects};`,
    `DELETE FROM class_schedules WHERE semester_id IN (
       SELECT id FROM semesters WHERE user_id IN ${demoUsers}
     );`,
    `DELETE FROM subjects WHERE semester_id IN (
       SELECT id FROM semesters WHERE user_id IN ${demoUsers}
     );`,
    `DELETE FROM semesters WHERE user_id IN ${demoUsers};`,
    `DELETE FROM sessions WHERE user_id IN ${demoUsers};`,
    `DELETE FROM password_reset_tokens WHERE user_id IN ${demoUsers};`,
    `DELETE FROM users WHERE id IN ${demoUsers};`,
  ]
}

function buildInsertSql(passwordHash, now) {
  const statements = [
    `INSERT INTO users
      (id, email, username, display_name, password_hash, created_at,
       updated_at, status, role, is_demo)
     VALUES (${[
       DEMO_USER_ID,
       DEMO_EMAIL,
       DEMO_USERNAME,
       DEMO_DISPLAY_NAME,
       passwordHash,
       now,
       now,
     ]
       .map(sqlValue)
       .join(', ')}, 'active', 'student', 1);`,
    `INSERT INTO semesters
      (id, user_id, academic_year, term, label, is_active, created_at,
       updated_at)
     VALUES (${[
       'demo-semester-2026-1',
       DEMO_USER_ID,
       '2026-2027',
       '1st Semester',
       '1st Semester 2026-2027',
       1,
       now,
       now,
     ]
       .map(sqlValue)
       .join(', ')});`,
  ]

  for (const [index, subject] of SUBJECTS.entries()) {
    statements.push(
      `INSERT INTO subjects
        (id, semester_id, name, units, professor, sort_order, created_at,
         updated_at)
       VALUES (${[
         subject.id,
         'demo-semester-2026-1',
         subject.name,
         subject.units,
         subject.professor,
         index,
         now,
         now,
       ]
         .map(sqlValue)
         .join(', ')});`,
    )

    for (const [categoryIndex, category] of subject.categories.entries()) {
      statements.push(
        `INSERT INTO grading_categories
          (id, subject_id, name, weight_percent, is_active, sort_order,
           created_at, updated_at)
         VALUES (${[
           category.id,
           subject.id,
           category.name,
           category.weight,
           1,
           categoryIndex,
           now,
           now,
         ]
           .map(sqlValue)
           .join(', ')});`,
      )

      for (const [activityIndex, activity] of category.activities.entries()) {
        const [name, earned, total, date] = activity
        statements.push(
          `INSERT INTO activities
            (id, category_id, name, score_earned, total_points, activity_date,
             created_at, updated_at)
           VALUES (${[
             `${category.id}-activity-${activityIndex + 1}`,
             category.id,
             name,
             earned,
             total,
             date,
             now,
             now,
           ]
             .map(sqlValue)
             .join(', ')});`,
        )
      }
    }

    for (const [classIndex, meeting] of subject.classes.entries()) {
      const [day, start, end, room] = meeting
      statements.push(
        `INSERT INTO class_schedules
          (id, semester_id, subject_id, day_of_week, start_time, end_time,
           room, created_at, updated_at)
         VALUES (${[
           `${subject.id}-class-${classIndex + 1}`,
           'demo-semester-2026-1',
           subject.id,
           day,
           start,
           end,
           room,
           now,
           now,
         ]
           .map(sqlValue)
           .join(', ')});`,
      )
    }
  }

  return statements
}

function runSqlFile(sql, local, label) {
  const directory = mkdtempSync(join(tmpdir(), 'neuron-demo-'))
  const file = join(directory, 'demo.sql')
  try {
    writeFileSync(file, sql)
    const result = spawnSync(
      process.execPath,
      [
        wranglerBin,
        'd1',
        'execute',
        'neuron',
        local ? '--local' : '--remote',
        '--file',
        file,
      ],
      { stdio: 'inherit', shell: false },
    )
    if (result.error) {
      throw result.error
    }
    if (result.status !== 0) {
      throw new Error(`${label} failed.`)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const now = new Date().toISOString()
  // The demo account never uses a password: signing in goes through
  // POST /api/auth/demo. A random hash keeps the NOT NULL column honest.
  const passwordHash = await hashPassword(crypto.randomUUID())
  // D1 rejects explicit BEGIN/COMMIT outside a Worker transaction, so the
  // reset runs as an ordered statement file. Re-running it is always safe.
  const sql = [
    ...deleteSql(),
    ...buildInsertSql(passwordHash, now),
    '',
  ].join('\n')

  runSqlFile(sql, args.local, 'Demo data write')

  stdout.write(
    [
      `Seeded the shared demo account (${DEMO_USERNAME} / ${DEMO_EMAIL}) in ${args.local ? 'local' : 'remote'} D1.`,
      `Sample data: 1 semester, ${SUBJECTS.length} subjects, and ${SUBJECTS.reduce(
        (total, subject) =>
          total +
          subject.categories.reduce(
            (count, category) => count + category.activities.length,
            0,
          ),
        0,
      )} scores.`,
      'Re-run this command to reset the demo data.',
      '',
    ].join('\n'),
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

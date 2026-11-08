export interface SemesterRow {
  id: string
  user_id: string
  academic_year: string
  term: string
  label: string
  is_active: number
  created_at: string
  updated_at: string
}

export interface SubjectRow {
  id: string
  semester_id: string
  name: string
  units: number
  professor: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface GradingCategoryRow {
  id: string
  subject_id: string
  name: string
  weight_percent: number
  is_active: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ActivityRow {
  id: string
  category_id: string
  name: string
  score_earned: number
  total_points: number
  activity_date: string
  created_at: string
  updated_at: string
}

export interface ScheduleClassRow {
  id: string
  semester_id: string
  subject_id: string
  day_of_week: number
  start_time: string
  end_time: string
  room: string | null
  created_at: string
  updated_at: string
}

export interface Semester {
  id: string
  userId: string
  academicYear: string
  term: string
  label: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Subject {
  id: string
  semesterId: string
  name: string
  units: number
  professor: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface GradingCategory {
  id: string
  subjectId: string
  name: string
  weightPercent: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  categoryId: string
  name: string
  scoreEarned: number
  totalPoints: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleClass {
  id: string
  semesterId: string
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  createdAt: string
  updatedAt: string
}

export interface GradingCategoryWithActivities extends GradingCategory {
  activities: Activity[]
}

export interface SubjectWithCategories extends Subject {
  categories: GradingCategoryWithActivities[]
}

export interface SemesterSetup {
  semester: Semester
  subjects: SubjectWithCategories[]
}

export function toSemester(row: SemesterRow): Semester {
  return {
    id: row.id,
    userId: row.user_id,
    academicYear: row.academic_year,
    term: row.term,
    label: row.label,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    semesterId: row.semester_id,
    name: row.name,
    units: row.units,
    professor: row.professor,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toGradingCategory(
  row: GradingCategoryRow,
): GradingCategory {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    weightPercent: row.weight_percent,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    scoreEarned: row.score_earned,
    totalPoints: row.total_points,
    date: row.activity_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toScheduleClass(row: ScheduleClassRow): ScheduleClass {
  return {
    id: row.id,
    semesterId: row.semester_id,
    subjectId: row.subject_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    room: row.room,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

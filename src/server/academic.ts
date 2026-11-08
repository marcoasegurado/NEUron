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

export interface SubjectWithCategories extends Subject {
  categories: GradingCategory[]
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

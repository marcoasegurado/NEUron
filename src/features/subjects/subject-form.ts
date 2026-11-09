import type { CreateSubjectInput } from '../../lib/academic-api'
import {
  createCategoryDraft,
  createSubjectDraft,
  MAX_CATEGORIES,
  validateSubjectDraft,
  type SubjectDraft,
  type SubjectErrors,
} from '../setup/draft'

export const MAX_SUBJECT_CATEGORIES = MAX_CATEGORIES

export function createSubjectForm(): SubjectDraft {
  return createSubjectDraft()
}

export function addSubjectCategory(subject: SubjectDraft): SubjectDraft {
  if (subject.categories.length >= MAX_SUBJECT_CATEGORIES) {
    return subject
  }
  return {
    ...subject,
    categories: [...subject.categories, createCategoryDraft()],
  }
}

export function removeSubjectCategory(
  subject: SubjectDraft,
  categoryId: string,
): SubjectDraft {
  if (subject.categories.length <= 1) {
    return subject
  }
  return {
    ...subject,
    categories: subject.categories.filter(
      (category) => category.id !== categoryId,
    ),
  }
}

export function validateSubjectForm(
  subject: SubjectDraft,
  existingNames: Iterable<string> = [],
): SubjectErrors {
  return validateSubjectDraft(subject, existingNames)
}

export function buildCreateSubjectInput(
  subject: SubjectDraft,
): CreateSubjectInput {
  return {
    name: subject.name.trim(),
    units: Number(subject.units),
    professor: subject.professor.trim() || null,
    categories: subject.categories.map((category) => ({
      name: category.name.trim(),
      weightPercent: Number(category.weight),
    })),
  }
}

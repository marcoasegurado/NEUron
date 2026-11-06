import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import { Badge, Button, Card, EmptyState } from '../../components/ui'

export function SubjectsPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Subjects, grading categories, and activity scores will appear here."
        actions={<Badge tone="pending">No subjects</Badge>}
      />
      <Card>
        <EmptyState
          title="No subjects yet"
          description="Subjects and their grading categories appear after semester setup."
          action={
            <Button
              variant="secondary"
              onClick={() => navigate('/setup')}
            >
              Go to semester setup
            </Button>
          }
        />
      </Card>
    </>
  )
}

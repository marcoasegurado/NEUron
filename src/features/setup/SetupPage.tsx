import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import { Badge, Button, Card, EmptyState } from '../../components/ui'

export function SetupPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Semester setup"
        description="Create a semester and configure each subject's grading categories."
        actions={<Badge tone="pending">Phase 3</Badge>}
      />
      <Card>
        <EmptyState
          title="Semester setup is not built yet"
          description="This flow arrives in Phase 3 after authentication. The app shell and design system are ready for it."
          action={
            <Button variant="ghost" onClick={() => navigate('/home')}>
              Back to Home
            </Button>
          }
        />
      </Card>
    </>
  )
}

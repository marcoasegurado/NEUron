import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../app/PageHeader'
import { Badge, Button, Card, EmptyState } from '../../components/ui'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Home"
        description="Your current grades will appear here once a semester is set up."
        actions={<Badge tone="pending">No active semester</Badge>}
      />
      <Card>
        <EmptyState
          title="No semester yet"
          description="NEUron needs a semester and its subjects before it can calculate grades."
          action={
            <Button onClick={() => navigate('/setup')}>
              Set up semester
            </Button>
          }
        />
      </Card>
    </>
  )
}

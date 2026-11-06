import { useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState } from '../components/ui'
import { PageHeader } from './PageHeader'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Page not found"
        description="The page you tried to open does not exist."
      />
      <Card>
        <EmptyState
          title="Nothing here"
          description="Check the address or return to Home to continue."
          action={<Button onClick={() => navigate('/home')}>Go to Home</Button>}
        />
      </Card>
    </>
  )
}

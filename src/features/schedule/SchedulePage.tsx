import { PageHeader } from '../../app/PageHeader'
import { Badge, Card, EmptyState } from '../../components/ui'

export function SchedulePage() {
  return (
    <>
      <PageHeader
        title="Schedule"
        description="Your weekly class timetable will appear here."
        actions={<Badge tone="pending">Phase 7</Badge>}
      />
      <Card>
        <EmptyState
          title="No classes yet"
          description="Class scheduling is planned for Phase 7. The schedule view will be added after the approved day range and overlap rules are confirmed."
        />
      </Card>
    </>
  )
}

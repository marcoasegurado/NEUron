import { PageHeader } from '../../app/PageHeader'
import { Badge, Card, EmptyState } from '../../components/ui'

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Account, semester, and conversion-table settings."
        actions={<Badge tone="pending">Needs specification</Badge>}
      />
      <Card>
        <EmptyState
          title="Settings are not specified yet"
          description="Only the navigation entry is confirmed. Controls will be added after an approved specification for this page."
        />
      </Card>
    </>
  )
}

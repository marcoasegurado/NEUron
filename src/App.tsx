import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { NotFoundPage } from './app/NotFoundPage'
import { HomePage } from './features/home/HomePage'
import { SchedulePage } from './features/schedule/SchedulePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { SetupPage } from './features/setup/SetupPage'
import { SubjectsPage } from './features/subjects/SubjectsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { MotherNotifications } from '#/components/mother/MotherNotifications'
import { useAppData } from '#/contexts/AppDataContext'

export const Route = createFileRoute('/app/mae/notificacoes')({
  component: MotherNotificationsPage,
})

function MotherNotificationsPage() {
  const { notificationRule, setNotificationRule, handleSendTestNotification } =
    useAppData()

  return (
    <MotherNotifications
      rule={notificationRule}
      onUpdateRule={setNotificationRule}
      onSendTestNotification={handleSendTestNotification}
    />
  )
}

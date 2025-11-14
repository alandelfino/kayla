import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  navigate({ to: '/dashboard/settings/account' })
}
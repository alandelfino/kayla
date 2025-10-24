import { SidebarProvider } from '@/components/ui/sidebar'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DashboardSidebar } from './-components/dashboard-sidebar'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  useEffect(() => {

    (async () => {

      const token = localStorage.getItem('kayla-token')
      if (!token) {
        navigate({ to: '/sign-in' })
      }

      const response = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:eA5lqIuH/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        navigate({ to: '/sign-in' })
      }

      const user = await response.json()
      localStorage.setItem('kayla-user', JSON.stringify(user))

    })()

  }, [])

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className='flex flex-col w-full h-lvh'>
        <Outlet />
      </main>

    </SidebarProvider>
  )
}
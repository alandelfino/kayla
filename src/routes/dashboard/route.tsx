import { SidebarProvider } from '@/components/ui/sidebar'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DashboardSidebar } from './-components/dashboard-sidebar'
import { useEffect } from 'react'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {

  useEffect(() => {
    auth.dashboardGuard()
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
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Topbar } from '../-components/topbar'
import { SettingsSidebar } from './-components/settings-sidebar'

export const Route = createFileRoute('/dashboard/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='flex flex-col w-full h-full'>
      <Topbar title="Configurações" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Configurações', href: '/dashboard/settings', isLast: true }]} />
      <div className='flex w-full h-full flex-1 overflow-auto'>
        <SettingsSidebar />
        <section className='flex-1 min-w-0'>
          <Outlet />
        </section>
      </div>
    </div>
  )
}
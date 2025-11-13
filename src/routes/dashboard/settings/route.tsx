import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { Topbar } from '../-components/topbar'

export const Route = createFileRoute('/dashboard/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouterState()
  const items = [
    { label: 'Conta', href: '/dashboard/settings/account' },
    { label: 'Usuários', href: '/dashboard/settings/users' },
    { label: 'Equipes', href: '/dashboard/settings/teams' },
    { label: 'Convites', href: '/dashboard/settings/invitations' },
    { label: 'Perfis', href: '/dashboard/settings/profiles' },
    { label: 'Financeiro', href: '/dashboard/settings/finance' },
    { label: 'Integrações', href: '/dashboard/settings/integrations' },
    { label: 'Webhooks', href: '/dashboard/settings/webhooks' },
  ]
  return (
    <div className='flex flex-col w-full h-full'>
      <Topbar title="Configurações" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Configurações', href: '/dashboard/settings', isLast: true }]} />
      <div className='flex w-full h-full flex-1 overflow-auto'>
        <aside className='w-48 pr-2 shrink-0 border-r p-4'>
          <nav className='flex flex-col gap-1'>
            {items.map((item) => {
              const active = router.location.pathname.startsWith(item.href)
              return (
                <Link key={item.href} to={item.href} className={`block rounded-md px-3 py-2 text-sm transition-colors ${active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'}`}>{item.label}</Link>
              )
            })}
          </nav>
        </aside>
        <section className='flex-1 min-w-0'>
          <Outlet />
        </section>
      </div>
    </div>
  )
}
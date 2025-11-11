import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { auth, privateInstance } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarAbbrev } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu'
import { ChevronsUpDown, LogOut, User as UserIcon, Building2, Mail } from 'lucide-react'

export const Route = createFileRoute('/user')({
  component: UserLayout,
})

type UserT = { email: string, name: string, avatarUrl?: string | null }

function getSubdomain() { return window.location.hostname.split('.')[0] }

function UserLayout() {
  const navigate = useNavigate()
  const router = useRouterState()

  const [user, setUser] = useState<UserT | null>(null)

  useEffect(() => {
    auth.userGuard()
    // Carrega usuário básico do storage
    try {
      const sub = getSubdomain()
      const raw = localStorage.getItem(`${sub}-kayla-user`)
      const parsed = raw ? JSON.parse(raw) : null
      const avatarUrl: string | null = parsed?.image?.url ?? parsed?.avatar_url ?? null
      setUser(parsed ? { email: parsed?.email ?? '', name: parsed?.name ?? '', avatarUrl } : null)
    } catch {}
    const handler = (evt: Event) => {
      const e = evt as CustomEvent<{ name?: string, email?: string, avatarUrl?: string | null }>
      const d = e.detail
      if (!d) return
      setUser((prev) => ({
        email: d.email ?? prev?.email ?? '',
        name: d.name ?? prev?.name ?? '',
        avatarUrl: d.avatarUrl ?? prev?.avatarUrl ?? null,
      }))
    }
    window.addEventListener('kayla:user-updated', handler as EventListener)
    return () => window.removeEventListener('kayla:user-updated', handler as EventListener)
  }, [])

  async function signOut() {
  try { await privateInstance.post('/api:eA5lqIuH/auth/logout', {}) } catch {}
    try {
      const sub = getSubdomain()
      localStorage.removeItem(`${sub}-kayla-authToken`)
      localStorage.removeItem(`${sub}-kayla-user`)
      localStorage.removeItem(`${sub}-kayla-company`)
    } catch {}
    navigate({ to: '/sign-in' })
  }

  // Utilitário compartilhado para gerar a abreviação do avatar

  const navItems = [
    { label: 'Meu Perfil', href: '/user/profile', icon: <UserIcon className='size-4' /> },
    { label: 'Minhas contas', href: '/user/companies', icon: <Building2 className='size-4' /> },
    { label: 'Convites', href: '/user/invites', icon: <Mail className='size-4' /> },
  ]

  return (
    <div className='flex flex-col w-full h-lvh'>
      {/* Top navigation only */}
      <div className='border-b h-16 w-full flex items-center px-4 bg-white dark:bg-neutral-900 sticky top-0 z-10 gap-4'>
        <img src='/placeholder.svg' alt='logo' className='h-8 w-auto rounded-md' />

        <NavigationMenu className='ml-1'>
          <NavigationMenuList>
            {navItems.map((item) => {
              const isActive = router.location.pathname.startsWith(item.href)
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild data-active={isActive}>
                    <Link to={item.href} className='inline-flex flex-row items-center gap-2 rounded-md px-2 py-1.5 whitespace-nowrap'>
                      {item.icon}
                      <span className='hidden sm:inline'>{item.label}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className='ml-auto'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='h-11 rounded-md flex items-center gap-2'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || ''} />
                  <AvatarFallback className='rounded-lg'>{getAvatarAbbrev(user?.name || '')}</AvatarFallback>
                </Avatar>
                <div className='hidden sm:grid text-left text-sm leading-tight'>
                  <span className='truncate font-medium max-w-[160px]'>{user?.name || ''}</span>
                  <span className='truncate text-xs max-w-[160px]'>{user?.email || ''}</span>
                </div>
                <ChevronsUpDown className='ml-auto size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='min-w-56 rounded-lg' side={'bottom'} align='end' sideOffset={8}>
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link to={item.href} className='w-full'>{item.icon} <span className='ml-2'>{item.label}</span></Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className='size-4' /> <span className='ml-2'>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <main className='flex-1 overflow-auto'>
        <Outlet />
      </main>
    </div>
  )
}
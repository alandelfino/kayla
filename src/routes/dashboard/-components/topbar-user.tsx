import { Check, ChevronsUpDown, LogOut, Moon, User, Users, Building2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { privateInstance } from "@/lib/auth"
import { toast } from "sonner"

type UserT = { email: string, name: string, avatarUrl?: string | null }

export function TopbarUser() {
  const navigate = useNavigate()

  const [user, setUser] = useState<UserT | null>(null)

  const darkModeKey = import.meta.env.VITE_DARK_MODE_KEY

  const isDarkMode = localStorage.getItem(darkModeKey) === 'true'
  const [darkMode, setDarkMode] = useState(isDarkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem(darkModeKey, 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem(darkModeKey, 'false')
    }
  }, [darkMode])

  useEffect(() => {
    // Mesmo padrão de chave usado em lib/auth.ts (subdomínio + sufixo)
    const subdomain = window.location.hostname.split('.')[0]
    const storageKey = `${subdomain}-kayla-user`

    const raw = localStorage.getItem(storageKey)
    let parsed: any = null
    try {
      parsed = raw ? JSON.parse(raw) : null
    } catch {
      parsed = null
    }

    if (parsed && typeof parsed === 'object') {
      const avatarUrl: string | null = parsed?.image?.url ?? parsed?.avatar_url ?? null
      setUser({ email: parsed.email ?? '', name: parsed.name ?? '', avatarUrl })
    } else {
      setUser(null)
      navigate({ to: '/sign-in' })
    }
  }, [navigate])

  // Ouve atualizações do perfil para refletir imediatamente
  useEffect(() => {
    const handler = (evt: Event) => {
      const e = evt as CustomEvent<{ name?: string, email?: string, avatarUrl?: string | null }>
      const detail = e.detail
      if (!detail) return
      setUser((prev) => ({
        email: detail.email ?? prev?.email ?? '',
        name: detail.name ?? prev?.name ?? '',
        avatarUrl: detail.avatarUrl ?? prev?.avatarUrl ?? null,
      }))
    }
    window.addEventListener('kayla:user-updated', handler as EventListener)
    return () => window.removeEventListener('kayla:user-updated', handler as EventListener)
  }, [])

  // Função para gerar iniciais do usuário
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const getSubdomain = () => window.location.hostname.split('.')[0]

  const { isPending: isLoggingOut, mutateAsync: doLogout } = useMutation({
    mutationFn: async () => {
      // Executa logout na API
      const res = await privateInstance.post('/api:eA5lqIuH/auth/logout', {})
      return res.data
    },
    onSettled: () => {
      // Limpa storage e redireciona
      try {
        const sub = getSubdomain()
        localStorage.removeItem(`${sub}-kayla-authToken`)
        localStorage.removeItem(`${sub}-kayla-user`)
      } catch { }
      toast.success('Você saiu da sua conta')
      navigate({ to: '/sign-in' })
    },
    onError: () => {
      // Mesmo se falhar na API, prossegue com logout local
    }
  })

  async function handleLogout() {
    await doLogout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 rounded-md flex items-center gap-2"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || ''} />
            <AvatarFallback className="rounded-lg">{getInitials(user?.name || '')}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:grid text-left text-sm leading-tight">
            <span className="truncate font-medium max-w-[160px]">{user?.name || ''}</span>
            <span className="truncate text-xs max-w-[160px]">{user?.email || ''}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side={'bottom'}
        align="end"
        sideOffset={8}
      >

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate({ to: '/user/profile' })}> <User /> Meu Perfil </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: '/user/companies' })}> <Users /> Minhas Contas </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDarkMode(!darkMode)}>
            <Moon /><span className="w-full">Dark mode</span> {darkMode && <Check />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate({ to: '/dashboard/company-profile' })}>
          <Building2 /> Conta
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut /> {isLoggingOut ? 'Saindo...' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
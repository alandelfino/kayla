import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { privateInstance, auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Building2, Trash, LogIn } from 'lucide-react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarAbbrev } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type UserCompany = {
  id: number
  created_at: number
  user_id?: number | null
  name: string
  alias?: string | null
  // New fields from updated API model
  is_me?: boolean
  company_id?: number
  active?: boolean
  users_profile_id?: number
  image?: { url?: string | null } | null
  segment?: string | null
  website?: string | null
  country?: string | null
}

export const Route = createFileRoute('/user/companies/')({
  component: UserCompaniesPage,
})

function getSubdomain() {
  const host = window.location.hostname
  if (host === 'localhost' || /^127(\.\d+){0,3}$/.test(host)) return 'localhost'
  const parts = host.split('.')
  return parts[0] ?? host
}

function UserCompaniesPage() {
  const navigate = useNavigate()
  const [loggingCompanyId, setLoggingCompanyId] = useState<number | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['auth', 'companies'],
    queryFn: async () => {
      // Listar empresas do usuário autenticado via endpoint de auth (escopo de /user)
      const res = await privateInstance.get('/api:eA5lqIuH/auth/companies')
      const rawItems = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      const normalized: UserCompany[] = rawItems
        .map((it: any) => {
          const rawId = Number(it.id)
          const rawCompanyId = typeof it.company_id === 'number' ? it.company_id : undefined
          return {
            id: Number.isFinite(rawId) ? rawId : (rawCompanyId ?? rawId),
            company_id: rawCompanyId,
            created_at: Number(it.created_at) || Date.now(),
            user_id: typeof it.user_id === 'number' ? it.user_id : null,
            name: String(it.name ?? ''),
            alias: typeof it.alias === 'string' ? it.alias : null,
            is_me: Boolean(it.is_me),
            active: typeof it.active === 'boolean' ? it.active : undefined,
            users_profile_id: typeof it.users_profile_id === 'number' ? it.users_profile_id : undefined,
            image: (it?.image && typeof it.image?.url === 'string') ? { url: it.image.url } : null,
            segment: typeof it.segment === 'string' ? it.segment : null,
            website: typeof it.website === 'string' ? it.website : null,
            country: typeof it.country === 'string' ? it.country : null,
          }
        })
        .filter((uc: UserCompany) => Number.isFinite(uc.id) && !!uc.name)
      return normalized
    },
  })

  useEffect(() => {
    if (isError) {
      console.warn('Falha ao carregar empresas:', error)
      toast.warning('Não foi possível carregar as empresas. Verifique sua conexão.', {
        description: 'Tentaremos novamente automaticamente.',
      })
    }
  }, [isError, error])

  useEffect(() => {
    auth.userGuard()
  }, [])

  async function enterCompany(uc: UserCompany) {
    const companyId = uc.company_id ?? uc.id
    setLoggingCompanyId(companyId)
    try {
      // Enviar a propriedade `company_id` da listagem como `company_id` na requisição
      const res = await privateInstance.post('/api:eA5lqIuH/auth/login-company', { company_id: companyId })
      const authToken: string | undefined = res?.data?.authToken
      const user = res?.data?.user
      const company = res?.data?.company ?? { id: companyId, name: uc.name, alias: uc.alias, image: uc.image ?? null }
      const sub = getSubdomain()
      if (authToken) { auth.normalizeTokenStorage(authToken) }
      if (user) {
        localStorage.setItem(`${sub}-directa-user`, JSON.stringify(user))
        try {
          const avatarUrl = user?.image?.url ?? user?.avatar_url ?? null
          window.dispatchEvent(new CustomEvent('directa:user-updated', { detail: { name: user?.name, email: user?.email, avatarUrl } }))
        } catch { }
      }
      localStorage.setItem(`${sub}-directa-company`, JSON.stringify(company))
      window.dispatchEvent(new CustomEvent('directa:company-updated', { detail: company }))
      navigate({ to: '/dashboard' })
    } catch (err) {
      console.error('Falha ao autenticar na empresa:', err)
    } finally {
      setLoggingCompanyId(null)
    }
  }

  return (
    <div className='mx-auto p-6'>

      <div className='flex items-center'>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-col text-xl'>
            {(() => { const sub = getSubdomain(); let name = 'Usuário'; try { const raw = localStorage.getItem(`${sub}-directa-user`); const u = raw ? JSON.parse(raw) : null; name = u?.name?.split(' ')[0] || name } catch { } return (<span className='text-md font-medium'>Olá {name},</span>) })()}
            <span className='text-sm text-muted-foreground'>Você tem {data?.length ?? 0} contas disponíveis, qual conta você deseja acessar?</span>
          </div>
        </div>

      </div>

      <div className='space-y-3 mt-4'>
        {isLoading && (
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className='flex items-center justify-between py-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-5 w-40' />
                  <Skeleton className='h-5 w-20' />
                </div>
                <Skeleton className='h-11 w-28' />
              </CardContent></Card>
            ))}
          </div>
        )}

        {isError && (<div className='text-destructive'>Não foi possível carregar as empresas. Verifique sua autenticação.</div>)}

        {!isLoading && !isError && (
          <Accordion type='single' collapsible className='w-full border rounded-lg'>
            {(data ?? []).map((uc) => (
              <AccordionItem key={uc.id} value={`company-${uc.id}`} className='px-4'>
                <AccordionTrigger className='hover:no-underline'>
                  <div className='flex items-center gap-3 group'>
                    <Avatar className='h-12 w-12 rounded-md border p-1'>
                      <AvatarImage src={uc.image?.url ?? undefined} alt={uc.name} />
                      <AvatarFallback className='rounded-md text-[10px] leading-none font-semibold'>
                        {getAvatarAbbrev(uc.name || 'Empresa')}
                      </AvatarFallback>
                    </Avatar>
                    <span className='font-medium leading-none text-lg'>{uc.name}</span>
                    {uc.is_me ? (
                      <Badge variant={'default'} className='text-xs bg-blue-50 text-blue-500'>proprietário</Badge>
                    ) : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className='flex flex-col gap-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>Acesso</span>
                        {uc.alias ? <Badge variant={'secondary'}>{uc.alias}</Badge> : <span className='text-xs text-muted-foreground'>—</span>}
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>Segmento</span>
                        <span className='text-sm'>{uc.segment ?? '—'}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>Website</span>
                        {uc.website ? (
                          <a href={uc.website} target='_blank' rel='noreferrer' className='text-sm text-primary hover:underline'>
                            {uc.website}
                          </a>
                        ) : (
                          <span className='text-sm'>—</span>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>País</span>
                        <span className='text-sm'>{uc.country ?? '—'}</span>
                      </div>
                    </div>
                    <div className='flex w-full gap-4'>
                      <Button variant={'destructive'} className='h-9 rounded-lg px-5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600' onClick={() => enterCompany(uc)} disabled={loggingCompanyId === (uc.company_id ?? uc.id)}>
                        {loggingCompanyId === uc.id ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Removendo...
                          </>
                        ) : (
                          <>
                            <Trash className='ml-1 h-4 w-4' />
                            Remover Acesso
                          </>
                        )}
                      </Button>
                      <Button variant={'default'} className='h-9 rounded-lg px-5' onClick={() => enterCompany(uc)} disabled={loggingCompanyId === (uc.company_id ?? uc.id)}>
                        {loggingCompanyId === uc.id ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Entrando
                          </>
                        ) : (
                          <>
                            Acessar <LogIn className='ml-1 h-4 w-4' />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            {(!data || data.length === 0) && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <Building2 className='h-5 w-5 text-muted-foreground' />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma empresa disponível</EmptyTitle>
                  <EmptyDescription>Você ainda não possui acesso a empresas. Quando tiver, elas aparecerão aqui.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button className='h-11 rounded-xl px-5'>Cadastrar uma empresa</Button>
                </EmptyContent>
              </Empty>
            )}
          </Accordion>
        )}
      </div>
    </div>
  )
}

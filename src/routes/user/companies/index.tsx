import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { privateInstance, auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ChevronRight, Building2 } from 'lucide-react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'

type UserCompany = { id: number; created_at: number; user_id?: number; name: string; alias?: string | null }

export const Route = createFileRoute('/user/companies/')({
  component: UserCompaniesPage,
})

function getSubdomain() { return window.location.hostname.split('.')[0] }

function UserCompaniesPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<number | null>(null)
  const [loggingCompanyId, setLoggingCompanyId] = useState<number | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['auth', 'companies'],
    queryFn: async () => {
      const res = await privateInstance.get('/api:eA5lqIuH/auth/companies')
      const items: UserCompany[] = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      return items.filter((uc: any) => uc && typeof uc.id === 'number' && typeof uc.name === 'string') as UserCompany[]
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
    try {
      const sub = getSubdomain()
      const raw = localStorage.getItem(`${sub}-kayla-user`)
      const parsed = raw ? JSON.parse(raw) : null
      const id: number | null = parsed?.id ?? parsed?.user?.id ?? null
      setUserId(id)
    } catch {}
  }, [])

  async function enterCompany(uc: UserCompany) {
    setLoggingCompanyId(uc.id)
    try {
      const res = await privateInstance.post('/api:eA5lqIuH/auth/login-company', { company_id: uc.id })
      const authToken: string | undefined = res?.data?.authToken
      const user = res?.data?.user
      const company = res?.data?.company ?? { id: uc.id, name: uc.name, alias: uc.alias }
      const sub = getSubdomain()
      if (authToken) { localStorage.setItem(`${sub}-kayla-authToken`, authToken) }
      if (user) {
        localStorage.setItem(`${sub}-kayla-user`, JSON.stringify(user))
        try {
          const avatarUrl = user?.image?.url ?? user?.avatar_url ?? null
          window.dispatchEvent(new CustomEvent('kayla:user-updated', { detail: { name: user?.name, email: user?.email, avatarUrl } }))
        } catch {}
      }
      localStorage.setItem(`${sub}-kayla-company`, JSON.stringify({ id: company?.id, name: company?.name, alias: company?.alias }))
      navigate({ to: '/dashboard' })
    } catch (err) {
      console.error('Falha ao autenticar na empresa:', err)
    } finally {
      setLoggingCompanyId(null)
    }
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='space-y-3'>
        {isLoading && (
          <div className='space-y-3'>
            {[1,2,3].map((i) => (
              <Card key={i}><CardContent className='flex items-center justify-between py-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-5 w-40' />
                  <Skeleton className='h-5 w-20' />
                </div>
                <Skeleton className='h-9 w-24' />
              </CardContent></Card>
            ))}
          </div>
        )}

        {isError && (<div className='text-destructive'>Não foi possível carregar as empresas. Verifique sua autenticação.</div>)}

        {!isLoading && !isError && (
          <div className='space-y-3'>
            {(data ?? []).map((uc) => (
              <Card key={uc.id}>
                <CardContent className='min-h-[68px] flex items-center justify-between py-4'>
                  <div className='flex items-center gap-3'>
                    <span className='font-medium leading-none'>{uc.name}</span>
                    {uc.alias ? <Badge variant={'secondary'}>{uc.alias}</Badge> : null}
                    {userId != null && uc.user_id === userId ? (
                      <Badge variant={'default'} className='text-xs'>proprietário</Badge>
                    ) : null}
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button onClick={() => enterCompany(uc)} disabled={loggingCompanyId === uc.id}>
                      {loggingCompanyId === uc.id ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Entrando
                        </>
                      ) : (
                        <>
                          Acessar <ChevronRight className='ml-1 h-4 w-4' />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  <Button>Cadastrar uma empresa</Button>
                </EmptyContent>
              </Empty>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

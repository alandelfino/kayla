import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { privateInstance, auth } from '@/lib/auth'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail } from 'lucide-react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

type Company = { id: number; name: string; alias?: string | null }
type Invite = { created_at: number; status: 'pending'; uuid: string; company: Company }

export const Route = createFileRoute('/user/invites/')({
  component: InvitesPage,
})

function InvitesPage() {
  useEffect(() => { auth.userGuard() }, [])

  const { data: invites, isLoading, isError, error } = useQuery({
    queryKey: ['auth', 'invites'],
    queryFn: async () => {
      const res = await privateInstance.get('/api:eA5lqIuH/auth/invites')
      const items: Invite[] = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      return items.filter((inv: any) => inv && inv.company && typeof inv.company.id === 'number') as Invite[]
    },
  })

  useEffect(() => {
    if (isError) {
      console.warn('Falha ao carregar convites:', error)
      toast.warning('Não foi possível carregar seus convites. Verifique sua conexão.', {
        description: 'Tentaremos novamente automaticamente.',
      })
    }
  }, [isError, error])

  return (
    <div className='container mx-auto p-6'>
      <div className='flex items-center gap-2 mb-4'>
        <Mail className='h-5 w-5 text-muted-foreground' />
        <span className='text-base font-semibold'>Convites</span>
      </div>
      {isLoading && (
        <div className='space-y-3'>
          {[1,2].map((i) => (
            <Card key={i}><CardContent className='flex items-center justify-between py-4'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-5 w-20' />
              </div>
              <Skeleton className='h-9 w-24' />
            </CardContent></Card>
          ))}
        </div>
      )}

      {isError && (<div className='text-destructive'>Não foi possível carregar os convites. Verifique sua autenticação.</div>)}

      {!isLoading && !isError && (
        <div className='space-y-3'>
          {(invites ?? []).map((inv) => (
            <Card key={inv.uuid}>
              <CardContent className='flex items-center justify-between py-4'>
                <div className='flex items-center gap-3'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <span className='font-medium'>{inv.company?.name ?? 'Empresa'}</span>
                  {inv.company?.alias ? <Badge variant={'secondary'}>{inv.company.alias}</Badge> : null}
                  <Badge variant={'outline'} className='ml-2'>Pendente</Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground'>Convite: {inv.uuid}</span>
                </div>
              </CardContent>
              <CardFooter className='pt-0 pb-4' />
            </Card>
          ))}
          {(!invites || invites.length === 0) && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Mail className='h-5 w-5 text-muted-foreground' />
                </EmptyMedia>
                <EmptyTitle>Nenhum convite pendente</EmptyTitle>
                <EmptyDescription>Você ainda não possui convites. Quando tiver, eles aparecerão aqui.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      )}
    </div>
  )
}

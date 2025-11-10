import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { Topbar } from '../-components/topbar'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Users, RefreshCcw, ArrowUpRight, SortAsc, SortDesc } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NewInvitationSheet } from './-components/new-invitation'
import { InvitationActionsCell } from './-components/invitation-actions'

export const Route = createFileRoute('/dashboard/invitations/')({
  component: RouteComponent,
})

type Invitation = {
  id: number
  email: string
  role?: 'admin' | 'member' | 'viewer'
  status?: 'pending' | 'canceled' | 'accepted'
  active?: boolean
  accepted?: boolean
  company_id?: number
  workspace_id?: number
  token?: string
  created_at?: string
  expires_at?: string
}

function RouteComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [sortBy, setSortBy] = useState<'email' | 'status' | 'created_at'>('created_at')
  const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc')

  // Ajuste os endpoints conforme a documentação de Convites da API
  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['invitations', currentPage, perPage, sortBy, orderBy],
    queryFn: async () => {
      // Busca convites usando GET com query params (inclui sort_by)
      // GET /api:0jQElwax/invitations?page={page}&per_page={perPage}&sort_by={sortBy}&order_by={orderBy}
      const response = await privateInstance.get(`/api:0jQElwax/invitations?page=${currentPage}&per_page=${perPage}&sort_by=${sortBy ?? 'created_at'}&order_by=${orderBy}`)
      if (response.status !== 200) {
        throw new Error('Erro ao carregar convites')
      }
      return response.data as any
    }
  })

  const [invitations, setInvitations] = useState<Invitation[]>([])

  const columns: ColumnDef<Invitation>[] = [
    {
      id: 'email',
      header: 'E-mail',
      cell: (i) => i.email,
      className: 'border-r'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (i) => {
        const raw = (i.status ?? (i as any).status ?? '') as string
        const normalized = raw.toString().trim().toLowerCase()
        const isAccepted = i.accepted === true || normalized === 'accepted'
        const isCanceled = normalized === 'canceled' || normalized === 'cancelled'
        const status = isAccepted ? 'accepted' : isCanceled ? 'canceled' : 'pending'
        const label = status === 'accepted' ? 'Aceito' : status === 'canceled' ? 'Cancelado' : 'Pendente'
        return (
          <span
            className={
              status === 'accepted'
                ? 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-200 bg-green-100 text-green-700'
                : status === 'canceled'
                ? 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-100 text-gray-700'
                : 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-amber-200 bg-amber-100 text-amber-700'
            }
          >
            <span className={status === 'accepted' ? 'h-1.5 w-1.5 rounded-full bg-green-600' : status === 'canceled' ? 'h-1.5 w-1.5 rounded-full bg-gray-500' : 'h-1.5 w-1.5 rounded-full bg-amber-600'} />
            {label}
          </span>
        )
      },
      headerClassName: 'w-[120px] border-r',
      className: 'w-[120px]'
    },
    {
      id: 'created_at',
      header: 'Enviado em',
      cell: (i) => {
        if (!i.created_at) return '-'
        try {
          const d = new Date(i.created_at)
          return d.toLocaleString()
        } catch {
          return i.created_at
        }
      },
      headerClassName: 'w-[200px] border-r',
      className: 'w-[200px]'
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (i) => (
        <InvitationActionsCell invitation={i} onChanged={() => refetch()} />
      ),
      headerClassName: 'w-[160px] border-r',
      className: 'w-[160px]'
    },
  ]

  useEffect(() => {
    if (!data) return
    const items = Array.isArray((data as any).items) ? (data as any).items : Array.isArray(data) ? data : []
    setInvitations(items)
    const itemsTotal = typeof (data as any).itemsTotal === 'number' ? (data as any).itemsTotal : items.length
    setTotalItems(itemsTotal)
  }, [data, perPage])

  useEffect(() => {
    if (isError) {
      console.error('Erro ao carregar convites')
    }
  }, [isError])

  return (
    <div className='flex flex-col w-full h-full'>
      <Topbar title='Convites' breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Convites', href: '/dashboard/invitations', isLast: true }]} />

      <div className='flex flex-col w-full h-full flex-1 overflow-hidden'>
        {/* Actions */}
        <div className='border-b flex w-full items-center p-2 gap-4'>
          <div className='flex items-center gap-4 flex-1'>
            {/* Ordenação - alinhada à esquerda */}
            <div className='flex items-center gap-2'>
              <span className='text-sm text-neutral-600 dark:text-neutral-300'>Ordenar por</span>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v as any); refetch() }}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Selecione' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='email'>E-mail</SelectItem>
                    <SelectItem value='status'>Status</SelectItem>
                    <SelectItem value='created_at'>Data de criação</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                size={'sm'}
                variant={'ghost'}
                title={orderBy === 'asc' ? 'Ascendente' : 'Descendente'}
                aria-label={orderBy === 'asc' ? 'Ordenação ascendente' : 'Ordenação descendente'}
                onClick={() => { setOrderBy(orderBy === 'asc' ? 'desc' : 'asc'); refetch() }}
              >
                {orderBy === 'asc' ? <SortAsc /> : <SortDesc />}
              </Button>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <Button size={'sm'} variant={'ghost'} disabled={isLoading || isRefetching} onClick={() => { refetch() }}>
              {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
            </Button>
            <NewInvitationSheet onCreated={() => { refetch() }} />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={invitations}
          loading={isLoading || isRefetching}
          page={currentPage}
          perPage={perPage}
          totalItems={totalItems}
          onChange={(next) => {
            if (typeof next.page === 'number') setCurrentPage(next.page)
            if (typeof next.perPage === 'number') setPerPage(next.perPage)
          }}
          emptyMessage='Nenhum convite encontrado'
          emptySlot={(
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Users className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>Nenhum convite ainda</EmptyTitle>
                <EmptyDescription>Envie convites para usuários participarem do workspace.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className='flex gap-2'>
                  <NewInvitationSheet onCreated={() => { refetch() }} />
                  <Button size={'sm'} variant={'outline'} disabled={isLoading || isRefetching} onClick={() => { refetch() }}>
                    {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
                  </Button>
                </div>
              </EmptyContent>
              <Button variant='link' asChild className='text-muted-foreground' size='sm'>
                <a href='#'>Saiba mais <ArrowUpRight className='inline-block ml-1 h-4 w-4' /></a>
              </Button>
            </Empty>
          )}
        />
      </div>
    </div>
  )
}
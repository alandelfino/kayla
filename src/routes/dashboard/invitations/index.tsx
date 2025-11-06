import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { Topbar } from '../-components/topbar'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Users, RefreshCcw, ArrowUpRight } from 'lucide-react'
import { NewInvitationSheet } from './-components/new-invitation'

export const Route = createFileRoute('/dashboard/invitations/')({
  component: RouteComponent,
})

type Invitation = {
  id: number
  email: string
  role?: 'admin' | 'member' | 'viewer'
  status?: 'pending' | 'accepted' | 'revoked'
  company_id?: number
  workspace_id?: number
  token?: string
  created_at?: string
  expires_at?: string
}

function RouteComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Ajuste os endpoints conforme a documentação de Convites da API
  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['invitations', currentPage, perPage],
    queryFn: async () => {
      // Exemplos (ajuste de acordo com a doc):
      // GET /api:eA5lqIuH/invitations?page={page}&per_page={perPage}&company_id={companyId}
      const response = await privateInstance.get(`/api:eA5lqIuH/invitations?page=${currentPage}&per_page=${perPage}`)
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
      id: 'role',
      header: 'Função',
      cell: (i) => {
        const label = i.role === 'admin' ? 'Administrador' : i.role === 'viewer' ? 'Leitor' : 'Membro'
        return (
          <Badge variant='outline' className='flex items-center gap-1'>
            <span>{label}</span>
          </Badge>
        )
      },
      headerClassName: 'w-[140px] border-r',
      className: 'w-[140px]'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (i) => {
        const label = i.status === 'accepted' ? 'Aceito' : i.status === 'revoked' ? 'Revogado' : 'Pendente'
        return label
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
          <div className='flex items-center gap-2 flex-1'>
            {/* Espaço para filtros futuros */}
          </div>
          <div className='flex items-center gap-2'>
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
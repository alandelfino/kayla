import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { RefreshCw, FileText } from 'lucide-react'

export const Route = createFileRoute('/dashboard/settings/billings/')({
  component: RouteComponent,
})

type Billing = {
  id: number
  created_at?: number
  updated_at?: number | null
  company_id?: number
  period_start?: number
  period_end?: number
  due_date?: number
  status?: 'pending' | 'canceled' | 'paid' | 'overdue'
  amount?: number
  total_sales?: number
  percentage_applied?: number
  total_orders?: number
}

type BillingsResponse = {
  itemsReceived?: number
  curPage?: number
  nextPage?: number | null
  prevPage?: number | null
  offset?: number
  perPage?: number
  items?: Billing[]
  itemsTotal?: number
  pageTotal?: number
}

function clampPerPage(value: number) {
  return Math.min(50, Math.max(20, value))
}

function RouteComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [billings, setBillings] = useState<Billing[]>([])
  const [totalItems, setTotalItems] = useState(0)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['billings', currentPage, perPage],
    queryFn: async () => {
      const response = await privateInstance.get<BillingsResponse>('/api:KW1Hgkpu/billings', {
        params: { page: currentPage, per_page: clampPerPage(perPage) }
      })
      if (response.status !== 200) {
        throw new Error('Erro ao carregar cobranças')
      }
      return response.data
    }
  })

  const fmtDate = (v?: number) => {
    if (!v) return '-'
    try { return new Date(v).toLocaleDateString() } catch { return String(v) }
  }
  const fmtCurrency = (v?: number) => {
    if (typeof v !== 'number') return '-'
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) } catch { return v.toLocaleString('pt-BR') }
  }
  const fmtNumber = (v?: number) => {
    if (typeof v !== 'number') return '-'
    return v.toLocaleString('pt-BR')
  }

  const columns: ColumnDef<Billing>[] = [
    {
      id: 'info',
      header: 'Informações',
      cell: (i) => {
        const start = fmtDate(i.period_start)
        const end = fmtDate(i.period_end)
        return (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm font-medium'>Período</span>
              <span className='text-sm text-muted-foreground'>{start} — {end}</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              <div className='inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-200 bg-neutral-50'>
                <span className='text-xs text-muted-foreground'>Valor</span>
                <span className='text-sm'>{fmtCurrency(i.amount)}</span>
              </div>
              <div className='inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-200 bg-neutral-50'>
                <span className='text-xs text-muted-foreground'>Vendas</span>
                <span className='text-sm'>{fmtNumber(i.total_sales)}</span>
              </div>
              <div className='inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-200 bg-neutral-50'>
                <span className='text-xs text-muted-foreground'>Pedidos</span>
                <span className='text-sm'>{fmtNumber(i.total_orders)}</span>
              </div>
              <div className='inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-200 bg-neutral-50'>
                <span className='text-xs text-muted-foreground'>Percentual</span>
                <span className='text-sm'>{typeof i.percentage_applied === 'number' ? `${i.percentage_applied}%` : '-'}</span>
              </div>
            </div>
          </div>
        )
      },
      headerClassName: 'min-w-[360px] border-r',
      className: 'min-w-[360px] border-r'
    },
    {
      id: 'due_date',
      header: 'Vencimento',
      cell: (i) => {
        if (!i.due_date) return '-'
        try {
          return new Date(i.due_date).toLocaleDateString()
        } catch {
          return String(i.due_date)
        }
      },
      headerClassName: 'w-[140px] min-w-[140px] border-r',
      className: 'w-[140px] min-w-[140px]'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (i) => {
        const raw = String(i.status ?? '').trim().toLowerCase()
        const status = raw === 'paid' ? 'paid' : raw === 'canceled' ? 'canceled' : raw === 'overdue' ? 'overdue' : 'pending'
        const label = status === 'paid' ? 'Pago' : status === 'canceled' ? 'Cancelado' : status === 'overdue' ? 'Vencido' : 'Pendente'
        return (
          <span
            className={
              status === 'paid'
                ? 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-200 bg-green-100 text-green-700'
                : status === 'canceled'
                ? 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-100 text-gray-700'
                : status === 'overdue'
                ? 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-red-200 bg-red-100 text-red-700'
                : 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-amber-200 bg-amber-100 text-amber-700'
            }
          >
            <span className={
              status === 'paid' ? 'h-1.5 w-1.5 rounded-full bg-green-600' :
              status === 'canceled' ? 'h-1.5 w-1.5 rounded-full bg-gray-500' :
              status === 'overdue' ? 'h-1.5 w-1.5 rounded-full bg-red-600' :
              'h-1.5 w-1.5 rounded-full bg-amber-600'
            } />
            {label}
          </span>
        )
      },
      headerClassName: 'w-[120px] min-w-[120px] border-r',
      className: 'w-[120px] min-w-[120px]'
    },
    {
      id: 'created_at',
      header: 'Criado em',
      cell: (i) => {
        if (!i.created_at) return '-'
        try {
          return new Date(i.created_at).toLocaleString()
        } catch {
          return String(i.created_at)
        }
      },
      headerClassName: 'w-[200px] min-w-[200px] border-r',
      className: 'w-[200px] min-w-[200px]'
    },
  ]

  useEffect(() => {
    if (!data) return
    const items = Array.isArray(data.items) ? data.items : []
    setBillings(items)
    const itemsTotal = typeof data.itemsTotal === 'number' ? data.itemsTotal : items.length
    setTotalItems(itemsTotal)
  }, [data, perPage])

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between p-4'>
        <div className='flex flex-col'>
          <h2 className='text-lg font-semibold'>Cobranças</h2>
          <p className='text-sm text-muted-foreground'>Faturas e períodos de cobrança da conta.</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant={'outline'}
            size={'icon'}
            className='xl:hidden'
            disabled={isLoading || isRefetching}
            aria-disabled={isLoading || isRefetching}
            aria-label='Atualizar cobranças'
            title='Atualizar cobranças'
            onClick={() => { refetch() }}
          >
            <RefreshCw className={`${(isLoading || isRefetching) ? 'animate-spin' : ''} w-4 h-4`} />
          </Button>
          <Button
            variant={'outline'}
            className='hidden xl:inline-flex'
            disabled={isLoading || isRefetching}
            aria-disabled={isLoading || isRefetching}
            aria-label='Atualizar cobranças'
            title='Atualizar cobranças'
            onClick={() => { refetch() }}
          >
            {(isLoading || isRefetching) ? <><RefreshCw className='animate-spin w-4 h-4' /> Atualizando...</> : <><RefreshCw className='w-4 h-4' /> Atualizar</>}
          </Button>
        </div>
      </div>

      <div className='flex flex-col w-full h-full flex-1 overflow-hidden pl-4'>
        <div className='border rounded-lg overflow-hidden h-full flex flex-col flex-1 border-r-0 border-b-0 rounded-tr-none! rounded-br-none! rounded-bl-none!'>
          <DataTable
            columns={columns}
            data={billings}
            loading={isLoading || isRefetching}
            page={currentPage}
            perPage={perPage}
            totalItems={totalItems}
            onChange={(next) => {
              if (typeof next.page === 'number') setCurrentPage(next.page)
              if (typeof next.perPage === 'number') setPerPage(next.perPage)
            }}
            emptyMessage='Nenhuma cobrança encontrada'
            emptySlot={(
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <FileText className='h-6 w-6' />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma cobrança ainda</EmptyTitle>
                  <EmptyDescription>As cobranças aparecerão aqui quando geradas.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className='flex gap-2'>
                    <Button variant={'outline'} disabled={isLoading || isRefetching} onClick={() => { refetch() }}>
                      {(isLoading || isRefetching) ? <><RefreshCw className='animate-spin' /> Atualizando...</> : <><RefreshCw /> Atualizar</>}
                    </Button>
                  </div>
                </EmptyContent>
              </Empty>
            )}
          />
        </div>
      </div>
    </div>
  )
}

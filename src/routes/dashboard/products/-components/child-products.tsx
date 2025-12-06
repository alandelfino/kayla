import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { NewChildProductDialog } from './new-child-product'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Checkbox } from '@/components/ui/checkbox'
import { privateInstance } from '@/lib/auth'
import { GitFork, Loader, PackagePlus, RefreshCcw, Trash } from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'

type ChildProduct = {
  id: number
  product_id: number
  sku?: string
  name?: string
  price?: number
  promotional_price?: number
  stock?: number
  reserved_stock?: number
  stock_available?: number
}

type ChildsResponse = {
  itemsReceived?: number
  curPage?: number
  nextPage?: number | null
  prevPage?: number | null
  offset?: number
  perPage?: number
  itemsTotal?: number
  pageTotal?: number
  items?: ChildProduct[]
} | ChildProduct[]

function normalizeChilds(data: ChildsResponse) {
  if (Array.isArray(data)) return { items: data, itemsTotal: data.length, pageTotal: 1 }
  const items = Array.isArray(data.items) ? data.items : []
  const itemsTotal = typeof data.itemsTotal === 'number' ? data.itemsTotal : items.length
  const pageTotal = typeof data.pageTotal === 'number' ? data.pageTotal : 1
  return { items, itemsTotal, pageTotal }
}


export function ChildProductsSheet({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [items, setItems] = useState<ChildProduct[]>([])
  const queryClient = useQueryClient()
  const bottomScrollerRef = React.useRef<HTMLDivElement | null>(null)
  const [mainScroller, setMainScroller] = useState<HTMLDivElement | null>(null)
  const [mirrorWidth, setMirrorWidth] = useState<number>(0)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['product-derivations', productId],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get(`/api:d9ly3uzj/derivated_products?product_id=${productId}`)
      if (response.status !== 200) throw new Error('Erro ao carregar derivações do produto')
      return response.data as ChildsResponse
    }
  })

  useEffect(() => {
    if (!data) return
    const normalized = normalizeChilds(data)
    const arr = Array.isArray(normalized.items) ? normalized.items : []
    setItems(arr)
  }, [data])

  useEffect(() => { if (isRefetching) setSelected([]) }, [isRefetching])
  useEffect(() => {
    const el = document.querySelector('[data-slot="datatable-scroller"]') as HTMLDivElement | null
    setMainScroller(el)
    if (el) setMirrorWidth(el.scrollWidth)
  }, [open, items])
  useEffect(() => {
    const el = mainScroller
    const mirror = bottomScrollerRef.current
    if (!el || !mirror) return
    const handleMain = () => { if (mirror) mirror.scrollLeft = el.scrollLeft }
    const handleMirror = () => { el.scrollLeft = mirror.scrollLeft }
    el.addEventListener('scroll', handleMain)
    mirror.addEventListener('scroll', handleMirror)
    return () => {
      el.removeEventListener('scroll', handleMain)
      mirror.removeEventListener('scroll', handleMirror)
    }
  }, [mainScroller, bottomScrollerRef.current])
  

  const columns: ColumnDef<ChildProduct>[] = useMemo(() => [
    {
      id: 'select',
      width: '60px',
      header: () => (<div className='flex justify-center items-center text-xs text-neutral-500'>Sel.</div>),
      cell: (row) => (
        <div className='flex justify-center items-center'>
          <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
        </div>
      ),
      headerClassName: 'w-[60px] min-w-[60px] border-r',
      className: 'w-[60px] min-w-[60px] font-medium border-r p-2!'
    },
    { id: 'sku', header: 'SKU', width: '160px', cell: (p) => p.sku ?? '—', headerClassName: 'w-[160px] min-w-[160px] border-r', className: 'w-[160px] min-w-[160px] p-2!' },
    { id: 'name', header: 'Nome', width: '280px', cell: (p) => p.name ?? '—', headerClassName: 'w-[280px] min-w-[280px] border-r', className: 'w-[280px] min-w-[280px] p-2!' },
    { id: 'price', header: 'Preço', width: '140px', cell: (p) => typeof p.price === 'number' ? p.price : 0, headerClassName: 'w-[140px] min-w-[140px] border-r', className: 'w-[140px] min-w-[140px] p-2!' },
    { id: 'promotional_price', header: 'Preço Promocional', width: '160px', cell: (p) => typeof p.promotional_price === 'number' ? p.promotional_price : '—', headerClassName: 'w-[160px] min-w-[160px] border-r', className: 'w-[160px] min-w-[160px] p-2!' },
    { id: 'stock_available', header: 'Disponível', width: '120px', cell: (p) => typeof p.stock_available === 'number' ? p.stock_available : '—', headerClassName: 'w-[120px] min-w-[120px] border-r', className: 'w-[120px] min-w-[120px] p-2!' },
  ], [items, selected])

  const toggleSelect = (id: number) => { if (selected.includes(id)) setSelected([]); else setSelected([id]) }

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) refetch() }}>
      <SheetTrigger asChild>
        <Button variant={'outline'}>
          <GitFork /> Derivações
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-[920px] h-full gap-2'>
        <SheetHeader className='p-3'>
          <SheetTitle>Derivações do produto</SheetTitle>
          <SheetDescription>Gerencie as derivações do produto selecionado.</SheetDescription>
        </SheetHeader>

        <div className='flex items-center gap-2 px-4 py-1 justify-end'>
          <Button variant={'ghost'} disabled={isLoading || isRefetching} onClick={() => { setSelected([]); refetch() }}>
            {(isLoading || isRefetching) ? (<RefreshCcw className='animate-spin' />) : (<RefreshCcw />)}
          </Button>

          <NewChildProductDialog productId={productId} onCreated={() => { setSelected([]); refetch(); queryClient.invalidateQueries({ queryKey: ['product-derivations', productId] }) }} />

          {selected.length === 1 ? (
            <DeleteChildProduct productId={productId} childId={selected[0]} onDeleted={() => { setSelected([]); refetch() }} />
          ) : (
            <Button variant={'outline'} disabled>
              <Trash /> Excluir
            </Button>
          )}
        </div>

        <div className='flex-1 min-h-0 overflow-hidden border-t'>
          <DataTable
            columns={columns}
            data={items}
            loading={isLoading || isRefetching}
            hideFooter
            emptyMessage='Nenhuma derivação encontrada'
            emptySlot={(
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <GitFork className='h-6 w-6' />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma derivação</EmptyTitle>
                  <EmptyDescription>
                    Crie uma derivação para o produto selecionado.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className='flex gap-2'>
                    <NewChildProductDialog productId={productId} onCreated={() => { setSelected([]); refetch() }} />
                    <Button variant={'ghost'} disabled={isLoading || isRefetching} onClick={() => { setSelected([]); refetch() }}>
                      {(isLoading || isRefetching) ? (<RefreshCcw className='animate-spin' />) : (<RefreshCcw />)}
                    </Button>
                  </div>
                </EmptyContent>
              </Empty>
            )}
            
          />
          <div className='sticky bottom-0 h-[18px] w-full overflow-x-auto bg-neutral-50 border-t' ref={bottomScrollerRef}>
            <div style={{ width: mirrorWidth ? `${mirrorWidth}px` : '100%' }} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}


function DeleteChildProduct({ productId, childId, onDeleted }: { productId: number, childId: number, onDeleted?: () => void }) {
  const [pending, setPending] = useState(false)
  const { mutate } = useMutation({
    mutationFn: async () => {
      setPending(true)
      const response = await privateInstance.delete(`/api:d9ly3uzj/derivated_products`, { data: { product_id: productId, child_id: childId } })
      if (response.status !== 200 && response.status !== 204) throw new Error('Erro ao excluir derivação')
      return true
    },
    onSuccess: () => { toast.success('Produto filho excluído!'); onDeleted?.() },
    onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Erro ao excluir produto filho') },
    onSettled: () => setPending(false)
  })

  return (
    <Button variant={'destructive'} onClick={() => mutate()} disabled={pending}>
      {pending ? <Loader className='animate-spin' /> : (<><Trash /> Excluir derivação</>)}
    </Button>
  )
}

export default ChildProductsSheet
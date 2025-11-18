import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Checkbox } from '@/components/ui/checkbox'
import { privateInstance } from '@/lib/auth'
import { GitFork, Loader, PackagePlus, RefreshCcw, Trash } from 'lucide-react'
import { toast } from 'sonner'

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

function toCentsFromText(val: string) {
  const onlyDigits = String(val || '').replace(/\D/g, '')
  const cents = onlyDigits ? parseInt(onlyDigits, 10) : 0
  return cents
}

export function ChildProductsSheet({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [selected, setSelected] = useState<number[]>([])
  const [items, setItems] = useState<ChildProduct[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['product-derivations', productId, currentPage, perPage],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get(`/api:d9ly3uzj/derivated_products?product_id=${productId}&page=${currentPage}&per_page=${Math.min(50, perPage)}`)
      if (response.status !== 200) throw new Error('Erro ao carregar derivações do produto')
      return response.data as ChildsResponse
    }
  })

  useEffect(() => {
    if (!data) return
    const normalized = normalizeChilds(data)
    const arr = Array.isArray(normalized.items) ? normalized.items : []
    setItems(arr)
    const itemsTotal = typeof normalized.itemsTotal === 'number' ? normalized.itemsTotal : arr.length
    setTotalItems(itemsTotal)
    const pageTotal = typeof normalized.pageTotal === 'number' ? normalized.pageTotal : Math.max(1, Math.ceil(itemsTotal / perPage))
    setTotalPages(pageTotal)
  }, [data, perPage])

  useEffect(() => { if (isRefetching) setSelected([]) }, [isRefetching])
  useEffect(() => { setSelected([]) }, [currentPage, perPage])
  useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages) }, [totalPages, currentPage])

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
      <SheetContent className='sm:max-w-[920px] h-full'>
        <SheetHeader>
          <SheetTitle>Derivações do produto</SheetTitle>
          <SheetDescription>Gerencie as derivações do produto selecionado.</SheetDescription>
        </SheetHeader>

        <div className='flex items-center gap-2 px-4 py-2 justify-end'>
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
        <div className='px-4'>
          <div className='border-t' />
        </div>

        <div className='flex-1 min-h-0 overflow-hidden px-4 pb-4'>
          <DataTable
            columns={columns}
            data={items}
            loading={isLoading || isRefetching}
            page={currentPage}
            perPage={perPage}
            totalItems={totalItems}
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
            onChange={({ page, perPage }) => { if (typeof page === 'number') setCurrentPage(page); if (typeof perPage === 'number') setPerPage(perPage); refetch() }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NewChildProductDialog({ productId, onCreated }: { productId: number, onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [priceText, setPriceText] = useState('')
  const [promoText, setPromoText] = useState('')

  const { data: parentData } = useQuery({
    queryKey: ['product-detail', productId],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get(`/api:c3X9fE5j/products/${productId}`)
      if (response.status !== 200) throw new Error('Erro ao carregar produto')
      return response.data as any
    }
  })

  const derivationIds: number[] = useMemo(() => {
    const p: any = parentData
    if (!p) return []
    const fromIds = Array.isArray(p.derivation_ids) ? p.derivation_ids : []
    const fromItems = Array.isArray(p?.derivations?.items) ? p.derivations.items.map((d: any) => d?.derivation_id ?? d?.derivation?.id ?? d?.id) : []
    const fromArray = Array.isArray(p?.derivations) ? p.derivations.map((d: any) => d?.derivation_id ?? d?.derivation?.id ?? d?.id) : []
    const ids = (fromIds.length ? fromIds : (fromItems.length ? fromItems : fromArray)).map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
    return ids
  }, [parentData])

  const [selectedItemsByDerivation, setSelectedItemsByDerivation] = useState<Record<number, number>>({})

  const handleSelectItem = (derivationId: number, itemId: number) => {
    setSelectedItemsByDerivation((prev) => ({ ...prev, [derivationId]: itemId }))
  }

  const { mutate } = useMutation({
    mutationFn: async () => {
      setSaving(true)
      const priceCents = toCentsFromText(priceText)
      const promoCents = toCentsFromText(promoText)
      const derivations = Object.entries(selectedItemsByDerivation)
        .map(([did, iid]) => ({ derivation_id: Number(did), derivation_item_id: Number(iid) }))
        .filter((p) => Number.isFinite(p.derivation_id) && Number.isFinite(p.derivation_item_id))
      const derivationsPayload: any[] = derivations.length > 0 ? derivations : [null]

      const payload = {
        sku,
        name,
        price: String(priceCents),
        promotional_price: Number.isFinite(promoCents) ? promoCents : 0,
        derivations: derivationsPayload,
      }

      const response = await privateInstance.post(`/api:d9ly3uzj/derivated_products`, { ...payload, product_id: productId })
      if (response.status !== 200 && response.status !== 201) throw new Error('Erro ao criar produto filho')
      return true
    },
    onSuccess: () => {
      toast.success('Produto filho criado!')
      setOpen(false)
      setSku('')
      setName('')
      setPriceText('')
      setPromoText('')
      setSelectedItemsByDerivation({})
      onCreated?.()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro ao criar produto filho')
    },
    onSettled: () => { setSaving(false) }
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={'default'}>
          <PackagePlus /> Nova derivação
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-[620px]'>
        <SheetHeader>
          <SheetTitle>Nova derivação</SheetTitle>
          <SheetDescription>Crie uma derivação com base nas derivações do produto.</SheetDescription>
        </SheetHeader>

        <div className='px-4 py-4 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='text-sm font-medium'>SKU</label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder='SKU' />
            </div>
            <div className='md:col-span-2'>
              <label className='text-sm font-medium'>Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Nome da derivação' />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium'>Preço</label>
              <Input value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder='R$ 0,00' inputMode='numeric' />
            </div>
            <div>
              <label className='text-sm font-medium'>Preço promocional</label>
              <Input value={promoText} onChange={(e) => setPromoText(e.target.value)} placeholder='R$ 0,00' inputMode='numeric' />
            </div>
          </div>

          <div className='space-y-3'>
            {derivationIds.length === 0 ? (
              <div className='text-sm text-muted-foreground'>O produto não possui derivações selecionadas.</div>
            ) : (
              derivationIds.map((did) => (
                <DerivationItemSelect key={did} derivationId={did} value={selectedItemsByDerivation[did]} onChange={(iid) => handleSelectItem(did, iid)} />
              ))
            )}
          </div>
        </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button variant={'outline'}>Cancelar</Button>
            </SheetClose>
            <Button disabled={saving} onClick={() => mutate()}>
              {saving ? <Loader className='animate-spin' /> : 'Criar derivação'}
            </Button>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DerivationItemSelect({ derivationId, value, onChange }: { derivationId: number, value?: number, onChange: (id: number) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['derivation-items', derivationId],
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get(`/api:JOs6IYNo/derivation_items?derivation_id=${derivationId}`)
      if (response.status !== 200) throw new Error('Erro ao carregar itens da derivação')
      return response.data as any
    }
  })

  const items = useMemo(() => {
    const raw = data as any
    if (!raw) return []
    const arr = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []
    return arr
  }, [data])

  return (
    <div className='grid grid-cols-1 gap-2'>
      <label className='text-sm font-medium'>Item da derivação #{String(derivationId)}</label>
      <Select value={value ? String(value) : ''} onValueChange={(v) => onChange(Number(v))} disabled={isLoading}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder={isLoading ? 'Carregando itens...' : 'Selecione um item'} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Array.isArray(items) ? items.map((it: any) => (
              <SelectItem key={it.id} value={String(it.id)}>{it.name ?? it.value ?? `Item #${it.id}`}</SelectItem>
            )) : null}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
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
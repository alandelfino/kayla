import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { privateInstance } from '@/lib/auth'
import { Loader, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'

export function NewChildProductDialog({ productId, onCreated }: { productId: number, onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')

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

  const queryClient = useQueryClient()

  const derivationIds: number[] = useMemo(() => {
    const p: any = parentData
    if (!p) return []
    const fromIds = Array.isArray(p.derivation_ids) ? p.derivation_ids : []
    const fromItems = Array.isArray(p?.derivations?.items) ? p.derivations.items.map((d: any) => d?.derivation_id ?? d?.derivation?.id ?? d?.id) : []
    const fromArray = Array.isArray(p?.derivations) ? p.derivations.map((d: any) => d?.derivation_id ?? d?.derivation?.id ?? d?.id) : []
    let raw = (fromIds.length ? fromIds : (fromItems.length ? fromItems : fromArray))

    if ((!raw || raw.length === 0) && productId) {
      const entries = queryClient.getQueriesData({ queryKey: ['products'] }) as any[]
      for (const [, listData] of entries) {
        const itemsArr = Array.isArray((listData as any)?.items) ? (listData as any).items : Array.isArray(listData) ? listData : []
        const found = itemsArr.find((it: any) => Number(it?.id) === Number(productId))
        if (found) {
          const fItems = Array.isArray(found?.derivations?.items) ? found.derivations.items.map((d: any) => d?.derivation_id ?? d?.derivation?.id ?? d?.id) : []
          const fArray = Array.isArray(found?.derivations) ? found.derivations.map((d: any) => d?.derivation_id ?? d?.derivation?.id ?? d?.id) : []
          const fIds = Array.isArray(found?.derivation_ids) ? found.derivation_ids : []
          raw = (fIds.length ? fIds : (fItems.length ? fItems : fArray))
          break
        }
      }
    }

    const ids = (raw as any[]).map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
    return ids
  }, [parentData, productId, queryClient])

  const derivationsInfo: { id: number, name?: string }[] = useMemo(() => {
    const p: any = parentData
    const fromItems = Array.isArray(p?.derivations?.items) ? p.derivations.items : null
    const fromArray = Array.isArray(p?.derivations) ? p.derivations : null
    const source = fromItems ?? fromArray ?? []
    const infos = Array.isArray(source) ? source.map((d: any) => {
      const id = d?.derivation_id ?? d?.derivation?.id ?? d?.id
      const name = d?.derivation?.store_name ?? d?.derivation?.catalog_name ?? d?.derivation?.name ?? d?.store_name ?? d?.catalog_name ?? d?.name ?? d?.nome
      return { id: Number(id), name: typeof name === 'string' ? name : undefined }
    }) : []
    const uniq = new Map<number, { id: number, name?: string }>()
    for (const it of infos) {
      if (Number.isFinite(it.id) && !uniq.has(it.id)) uniq.set(it.id, it)
    }
    for (const id of derivationIds) {
      if (!uniq.has(id)) uniq.set(id, { id })
    }
    return Array.from(uniq.values())
  }, [parentData, derivationIds])

  const [selectedItemsByDerivation, setSelectedItemsByDerivation] = useState<Record<number, number>>({})

  const handleSelectItem = (derivationId: number, itemId: number) => {
    setSelectedItemsByDerivation((prev) => ({ ...prev, [derivationId]: itemId }))
  }

  const { mutate } = useMutation({
    mutationFn: async () => {
      setSaving(true)
      const derivations = Object.entries(selectedItemsByDerivation)
        .map(([did, iid]) => ({ derivation_id: Number(did), derivation_item_id: Number(iid) }))
        .filter((p) => Number.isFinite(p.derivation_id) && Number.isFinite(p.derivation_item_id))
      if (!sku || !name) throw new Error('Preencha SKU e Nome')
      if (derivations.length === 0) throw new Error('Selecione ao menos um item de derivação')
      const derivationsPayload: any[] = derivations

      const payload = {
        sku,
        name,
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

          <div className='space-y-3'>
            {derivationIds.length === 0 ? (
              <div className='text-sm text-muted-foreground'>O produto não possui derivações selecionadas.</div>
            ) : (
              derivationsInfo.map((info) => (
                <DerivationItemSelect key={info.id} derivationId={info.id} label={info.name} value={selectedItemsByDerivation[info.id]} onChange={(iid) => handleSelectItem(info.id, iid)} />
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

function DerivationItemSelect({ derivationId, label, value, onChange }: { derivationId: number, label?: string, value?: number, onChange: (id: number) => void }) {
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
      <label className='text-sm font-medium'>{label ?? `Derivação #${String(derivationId)}`}</label>
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
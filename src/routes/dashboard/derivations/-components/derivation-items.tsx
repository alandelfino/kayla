import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Boxes, GripVertical, List } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DerivationItemCreateDialog } from './derivation-item-create-dialog'
import { DerivationItemEditDialog } from './derivation-item-edit-dialog'
import { DerivationItemDeleteDialog } from './derivation-item-delete-dialog'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'

type DerivationItem = {
  id: number
  order: number
  value: string
  name?: string
}

export function DerivationItemsSheet({ derivationId, derivationType }: { derivationId: number, derivationType: 'text' | 'color' | 'image' }) {
  const [open, setOpen] = useState(false)
  const [itemsLocal, setItemsLocal] = useState<DerivationItem[]>([])
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null)
  const draggedItem = useMemo(() => itemsLocal.find((i) => i.id === draggingId) ?? null, [itemsLocal, draggingId])
  // Guarda a ordenação anterior para reverter em caso de erro ao salvar
  const prevOrderRef = useRef<DerivationItem[]>([])

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['derivation-items', derivationId],
    queryFn: async () => {
      // Endpoint de listagem conforme Derivations spec
      const response = await privateInstance.get(`/api:JOs6IYNo/derivation_items?derivation_id=${derivationId}`)
      if (response.status !== 200) throw new Error('Erro ao carregar itens da derivação')
      return response.data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: open,
  })

  const items: DerivationItem[] = useMemo(() => {
    if (!data) return []
    const raw = Array.isArray((data as any).items) ? (data as any).items : Array.isArray(data) ? data : []
    const normalized: DerivationItem[] = raw.map((i: any) => ({
      id: Number(i.id),
      order: Number(i.order ?? i.ordem ?? i.position ?? 0),
      value: String(i.value ?? i.valor ?? i.color ?? i.image_url ?? ''),
      name: typeof i.name === 'string' ? i.name : (typeof i.nome === 'string' ? i.nome : ''),
    }))
    normalized.sort((a, b) => a.order - b.order)
    return normalized
  }, [data])

  useEffect(() => {
    setItemsLocal(items)
  }, [items])

  // Drag and drop
  const handleDragStart = (id: number) => { if (savingOrder) return; setDraggingId(id) }
  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    if (savingOrder) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const isBefore = e.clientY < rect.top + rect.height / 2
    setDropPosition(isBefore ? 'before' : 'after')
    if (hoveredId !== targetId) setHoveredId(targetId)
  }
  const handleDragEnter = (targetId: number) => { if (savingOrder) return; setHoveredId(targetId) }
  const handleDragLeave = (targetId: number) => { if (savingOrder) return; if (hoveredId === targetId) setHoveredId(null) }
  const handleDrop = (targetId: number) => {
    if (savingOrder) return
    if (!draggingId || draggingId === targetId) return
    const sourceIndex = itemsLocal.findIndex((i) => i.id === draggingId)
    const targetIndex = itemsLocal.findIndex((i) => i.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return
    const next = [...itemsLocal]
    const [moved] = next.splice(sourceIndex, 1)
    const insertIndex = dropPosition === 'after' ? targetIndex + 1 : targetIndex
    next.splice(insertIndex, 0, moved)
    const reordered = next.map((it, idx) => ({ ...it, order: idx + 1 }))
    // snapshot da ordenação anterior
    prevOrderRef.current = itemsLocal
    setItemsLocal(reordered)
    reorderMutation(reordered)
    setHoveredId(null)
    setDropPosition(null)
    setDraggingId(null)
  }

  // Create item dialog
  // Create dialog agora é um componente isolado que gerencia seu próprio estado e mutation

  // Edit item dialog
  // Edit dialog agora é um componente isolado que gerencia seu próprio estado e mutation

  // Delete item
  // Delete dialog agora é um componente isolado que gerencia seu próprio estado e mutation

  // Persistir ordenação
  const { isPending: savingOrder, mutate: reorderMutation } = useMutation({
    mutationFn: async (reordered: DerivationItem[]) => {
      const payload = {
        derivation_id: derivationId,
        items: reordered.map((it) => ({ id: String(it.id) }))
      }
      const response = await privateInstance.put(
        '/api:JOs6IYNo/derivation_items_reorder',
        payload
      )
      if (response.status !== 200 && response.status !== 204) throw new Error('Erro ao salvar ordenação')
      return true
    },
    onSuccess: () => {
      toast.success('Ordenação salva!')
    },
    onError: () => {
      // Reverte para a ordenação anterior caso ocorra erro
      setItemsLocal(prevOrderRef.current)
      toast.error('Não foi possível salvar a ordenação. Voltamos para a ordenação anterior.')
      refetch()
    }
  })

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) refetch() }}>
      <SheetTrigger asChild>
        <Button size={'sm'} variant={'ghost'}>
          <List /> Items
        </Button>
      </SheetTrigger>
      {/* Sheet com largura ajustada e layout em coluna ocupando toda a altura */}
      <SheetContent className='w-lg sm:max-w-[1000px]'>
        <SheetHeader>
          <SheetTitle>Itens da derivação</SheetTitle>
          <SheetDescription>Gerencie os itens da derivação selecionada.</SheetDescription>
        </SheetHeader>

        {/* Conteúdo principal ocupando todo o espaço disponível */}
        <div className='flex flex-col flex-1 overflow-hidden'>
          {/* Actions */}
          <div className='flex items-center gap-2 px-4'>
            <DerivationItemCreateDialog derivationId={derivationId} derivationType={derivationType} itemsCount={itemsLocal.length} onCreated={() => refetch()} />
          </div>

          {/* Listagem simples com drag-and-drop */}
          <div className='my-4 mb-0 flex-1 flex flex-col overflow-hidden border-t'>
            <div className='px-4 py-2 text-xs text-muted-foreground sticky top-0 bg-background border-b z-10'>
              Arraste os itens para reordenar {savingOrder ? '(salvando...)' : ''}
            </div>
            <ul className='flex-1 overflow-auto px-4 py-2 space-y-2'>
              {(isLoading || isRefetching) ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <li key={`sk-${idx}`} className='rounded-md border bg-background shadow-sm px-3 py-2 flex items-center gap-3'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-5 w-12' />
                    <Skeleton className='h-5 w-24' />
                    {(derivationType === 'color' || derivationType === 'image') && (
                      <Skeleton className='h-[30px] w-[30px] rounded-sm' />
                    )}
                    <Skeleton className='h-5 w-full flex-1' />
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-8 w-16' />
                      <Skeleton className='h-8 w-16' />
                    </div>
                  </li>
                ))
              ) : (
                itemsLocal.length === 0 ? (
                  <li className='p-4 text-center text-sm text-muted-foreground'>Nenhum item encontrado</li>
                ) : (
                  itemsLocal.map((i) => (
                  <li
                    key={i.id}
                    draggable={!savingOrder}
                    onDragStart={() => handleDragStart(i.id)}
                    onDragOver={(e) => handleDragOver(e, i.id)}
                    onDragEnter={() => handleDragEnter(i.id)}
                    onDragLeave={() => handleDragLeave(i.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDrop={() => handleDrop(i.id)}
                    className={`group relative rounded-md border transition-all duration-200 ease-out px-3 py-2 flex items-center gap-3 ${draggingId === i.id ? 'border-2 border-dashed border-muted-foreground/40 bg-transparent shadow-none ring-0 opacity-90' : 'bg-background shadow-sm hover:shadow-md'} ${hoveredId === i.id && draggingId !== i.id ? 'ring-1 ring-primary/30 bg-primary/5' : ''}`}
                  >
                    {/* Indicador visual da posição de drop */}
                    {hoveredId === i.id && draggingId !== i.id && (
                      <div className={`absolute left-0 right-0 h-0.5 bg-primary/60 ${dropPosition === 'after' ? 'bottom-0' : 'top-0'}`} />
                    )}
                    {/* Preview fantasma do item sendo arrastado */}
                    {hoveredId === i.id && draggingId !== null && draggingId !== i.id && draggedItem && (
                      <div className={`absolute left-2 right-2 ${dropPosition === 'after' ? 'bottom-[-10px]' : 'top-[-10px]'} pointer-events-none`}> 
                        <div className='rounded-md border-2 border-dashed border-muted-foreground/40 bg-background/80 backdrop-blur-[2px] shadow-sm px-3 py-2 text-xs flex items-center gap-3 opacity-85'>
                          <GripVertical className='text-muted-foreground' />
                          <span className='inline-flex items-center justify-center px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground'>#{draggedItem.order}</span>
                          <span className='truncate font-medium min-w-[80px] max-w-[180px]' title={draggedItem.name ?? ''}>{draggedItem.name ?? ''}</span>
                          {derivationType === 'color' ? (
                            <>
                              <div
                                className='rounded-sm border h-[20px] w-[20px]'
                                style={{
                                  backgroundColor: /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(draggedItem.value ?? '') ? draggedItem.value : '#000000'
                                }}
                                aria-label={`Cor ${draggedItem.value}`}
                              />
                              <span className='truncate text-[11px] text-muted-foreground'>{draggedItem.value}</span>
                            </>
                          ) : derivationType === 'image' ? (
                            <>
                              <div className='rounded-sm border overflow-hidden h-[20px] w-[20px]'>
                                <img src={draggedItem.value} alt='Imagem do item' className='h-full w-full object-cover' />
                              </div>
                              <span className='truncate text-[11px] text-muted-foreground'>{draggedItem.value}</span>
                            </>
                          ) : (
                            <span className='truncate text-[11px] text-muted-foreground'>{draggedItem.value}</span>
                          )}
                        </div>
                      </div>
                    )}
                    <GripVertical className={`text-muted-foreground ${savingOrder ? 'cursor-not-allowed opacity-50' : (draggingId ? 'cursor-grabbing' : 'cursor-grab')}`} />
                    <span className='inline-flex items-center justify-center px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground'>#{i.order}</span>
                    {/* Nome do item */}
                    <span className='truncate font-medium min-w-[120px] max-w-[240px]' title={i.name ?? ''}>{i.name ?? ''}</span>

                    {derivationType === 'color' ? (
                      <>
                        <div
                          className='rounded-sm border h-[30px] w-[30px]'
                          style={{
                            backgroundColor: /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(i.value ?? '') ? i.value : '#000000'
                          }}
                          aria-label={`Cor ${i.value}`}
                        />
                        <span className='flex-1 truncate text-sm text-muted-foreground'>{i.value}</span>
                      </>
                    ) : derivationType === 'image' ? (
                      <>
                        <div className='rounded-sm border overflow-hidden h-[30px] w-[30px]'>
                          <img src={i.value} alt='Imagem do item' className='h-full w-full object-cover' />
                        </div>
                        <span className='flex-1 truncate text-sm text-muted-foreground'>{i.value}</span>
                      </>
                    ) : (
                      <span className='flex-1 truncate text-sm text-muted-foreground'>{i.value}</span>
                    )}
                    <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity'>
                      <DerivationItemEditDialog derivationId={derivationId} derivationType={derivationType} item={i} onUpdated={() => refetch()} />
                      <DerivationItemDeleteDialog itemId={i.id} onDeleted={() => refetch()} />
                    </div>
                  </li>
                  ))
                )
              )}
            </ul>
          </div>
        </div>

        <SheetFooter className='border-t'>
          <div className='flex w-full items-center justify-between'>
            <span className='text-sm text-muted-foreground'>
              {itemsLocal.length} {itemsLocal.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
            </span>
            <SheetClose asChild>
              <Button variant='outline' className='w-fit'>Fechar</Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
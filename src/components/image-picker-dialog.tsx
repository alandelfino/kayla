import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Images, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { Skeleton } from '@/components/ui/skeleton'

type ApiMedia = {
  id: number
  name?: string
  image?: { url?: string | null, name?: string | null, size?: number | null, mime?: string | null } | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (url: string, media: ApiMedia) => void
}

export function ImagePickerDialog({ open, onOpenChange, onInsert }: Props) {
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(20)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['medias-picker', page, perPage, open],
    enabled: open,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await privateInstance.get(`/api:qSTOvw0A/medias?page=${page}&per_page=${perPage}`)
      if (res.status !== 200) throw new Error('Erro ao carregar mídias')
      return res.data
    },
  })

  const payload = useMemo(() => {
    const d: any = data
    if (!d) {
      return {
        items: [] as ApiMedia[],
        curPage: page,
        pageTotal: 1,
        itemsTotal: 0,
        perPage,
      }
    }
    const mediasObj = d.medias ?? d
    const items: ApiMedia[] = Array.isArray(mediasObj?.items)
      ? (mediasObj.items as ApiMedia[])
      : (Array.isArray(d) ? (d as ApiMedia[]) : [])
    const curPage = typeof mediasObj?.curPage === 'number' ? mediasObj.curPage : page
    const pageTotal = typeof mediasObj?.pageTotal === 'number' ? mediasObj.pageTotal : 1
    const itemsTotal = typeof mediasObj?.itemsTotal === 'number' ? mediasObj.itemsTotal : items.length
    const perPageVal = typeof mediasObj?.perPage === 'number' ? mediasObj.perPage : perPage
    return { items, curPage, pageTotal, itemsTotal, perPage: perPageVal }
  }, [data, page, perPage])

  const medias: ApiMedia[] = useMemo(() => {
    // Sem filtro de pesquisa: mostrar a listagem recebida
    return payload.items
  }, [payload.items])

  const selectedMedia = useMemo(() => {
    return medias.find((m) => m.id === selectedId) ?? null
  }, [medias, selectedId])

  const formatBytes = (bytes?: number | null) => {
    if (!bytes || typeof bytes !== 'number' || bytes < 0) return '—'
    const kb = bytes / 1024
    if (kb < 1024) return `${Math.round(kb)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB`
  }

  const getExtension = (name?: string | null, mime?: string | null) => {
    const fromName = typeof name === 'string' && name.includes('.') ? name.split('.').pop() : null
    if (fromName) return (fromName ?? '').toUpperCase()
    const fromMime = typeof mime === 'string' && mime.includes('/') ? mime.split('/').pop() : null
    return fromMime ? (fromMime ?? '').toUpperCase() : '—'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[1000px] w-full p-0 overflow-hidden flex flex-col'>
        {/* Header com título */}
        <div className='border-b px-4 py-3'>
          <DialogHeader>
            <DialogTitle className='text-lg'>Selecionar imagem</DialogTitle>
          </DialogHeader>
        </div>

        {/* Barra de ações acima da listagem */}
        <div className='px-2 flex items-center justify-end gap-2'>
          <Button variant={'outline'} size={'sm'} disabled={isLoading || isRefetching} onClick={() => refetch()}>
            {(isLoading || isRefetching) ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button
            variant={'ghost'}
            size={'sm'}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size={'sm'}
            disabled={!selectedMedia || !selectedMedia.image?.url}
            onClick={() => {
              if (selectedMedia?.image?.url) {
                onInsert(selectedMedia.image.url, selectedMedia)
                onOpenChange(false)
              }
            }}
          >
            Inserir
          </Button>
        </div>

        {/* Grid com espaçamentos profissionais, ocupando toda a altura disponível */}
        <div className='p-4 flex-1 overflow-auto'>
          {isLoading || isRefetching ? (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='rounded-md border bg-background overflow-hidden'>
                  {/* Área de imagem com mesma proporção */}
                  <Skeleton className='aspect-square w-full' />
                  {/* Área inferior com título e chips simulando extensão e tamanho */}
                  <div className='p-2'>
                    <Skeleton className='h-3 w-3/4' />
                    <div className='mt-1 flex items-center gap-2'>
                      <Skeleton className='h-3 w-10 rounded' />
                      <Skeleton className='h-3 w-14 rounded' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : medias.length === 0 ? (
            <div className='w-full h-[200px] flex items-center justify-center text-sm text-muted-foreground'>Nenhuma mídia encontrada</div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
              {medias.map((m) => (
                <div key={m.id} className='group relative rounded-md border bg-background hover:shadow-md transition-shadow overflow-hidden'>
                  <div className='aspect-square w-full bg-muted flex items-center justify-center'>
                    {m.image?.url ? (
                      <img src={m.image.url} alt={m.name ?? 'media'} className='object-cover w-full h-full' />
                    ) : (
                      <div className='flex flex-col items-center justify-center text-muted-foreground'>
                        <Images className='w-10 h-10' />
                        <span className='text-xs mt-2'>Sem imagem</span>
                      </div>
                    )}
                  </div>
                  <div className='p-2 flex items-center justify-between gap-2'>
                    <div className='flex-1 min-w-0'>
                      <div className='text-xs font-medium truncate' title={m.name ?? ''}>{m.name ?? 'Mídia'}</div>
                      <div className='mt-1 flex items-center gap-2 text-[10px] text-muted-foreground'>
                        <span className='px-1 rounded border bg-muted/20'>{getExtension(m.image?.name, m.image?.mime)}</span>
                        <span className='px-1 rounded border bg-muted/20'>{formatBytes(m.image?.size)}</span>
                      </div>
                    </div>
                    <div className='opacity-100 group-hover:opacity-100 transition-opacity flex items-center gap-1'>
                      <Checkbox
                        checked={selectedId === m.id}
                        onCheckedChange={(checked) => {
                          const isChecked = Boolean(checked)
                          setSelectedId(isChecked ? m.id : null)
                        }}
                        aria-label={`Selecionar mídia ${m.name ?? m.id}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className='px-4 py-3 border-t'>
          {(() => {
            const totalItems = payload.itemsTotal ?? medias.length
            const totalPages = Math.max(1, payload.pageTotal ?? Math.ceil(totalItems / Math.max(perPage, 1)))
            return (
              <div className='flex w-full items-center justify-between gap-2'>
                <span className='text-sm'>Página {payload.curPage} de {totalPages}</span>
                <div className='flex items-center gap-2'>
                  <span className='text-sm'>Itens por página</span>
                  <Select value={perPage.toString()} onValueChange={(v) => { const next = parseInt(v); if (!Number.isNaN(next)) { setPage(1); setPerPage(next) } }}>
                    <SelectTrigger className='w-[90px]'>
                      <SelectValue placeholder={perPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='20'>20</SelectItem>
                        <SelectItem value='30'>30</SelectItem>
                        <SelectItem value='50'>50</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Separator orientation='vertical' />
                  <Button variant={'outline'} size={'icon'} onClick={() => setPage(1)} disabled={payload.curPage === 1}><ChevronsLeft /></Button>
                  <Button variant={'outline'} size={'icon'} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={payload.curPage === 1}><ChevronLeft /></Button>
                  <Button variant={'outline'} size={'icon'} onClick={() => setPage((p) => p + 1)} disabled={payload.curPage >= totalPages}><ChevronRight /></Button>
                  <Button variant={'outline'} size={'icon'} onClick={() => setPage(totalPages)} disabled={payload.curPage >= totalPages}><ChevronsRight /></Button>
                </div>
              </div>
            )
          })()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
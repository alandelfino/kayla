import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { privateInstance } from '@/lib/auth'
import { Topbar } from '../-components/topbar'
import { Button } from '@/components/ui/button'
import { Edit, Images, RefreshCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { NewMediaDialog } from './-components/new-media-dialog'
import { EditMediaDialog } from './-components/edit-media-dialog'
import { DeleteMediaDialog } from './-components/delete-media-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'

export const Route = createFileRoute('/dashboard/media/')({
  component: RouteComponent,
})

type ApiMedia = {
  id: number
  name?: string
  image?: { url?: string | null } | null
  created_at?: number
  updated_at?: number
}

function RouteComponent() {
  const [selected, setSelected] = useState<ApiMedia | null>(null)
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(20)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['medias', page, perPage],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
        nextPage: null as number | null,
        prevPage: null as number | null,
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
    const nextPage = typeof mediasObj?.nextPage === 'number' ? mediasObj.nextPage : (curPage < pageTotal ? curPage + 1 : null)
    const prevPage = typeof mediasObj?.prevPage === 'number' ? mediasObj.prevPage : (curPage > 1 ? curPage - 1 : null)
    return { items, curPage, pageTotal, itemsTotal, perPage: perPageVal, nextPage, prevPage }
  }, [data, page, perPage])

  const medias: ApiMedia[] = payload.items

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
    <div className='flex flex-col w-full h-full'>
      <Topbar title="Midias" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Midias', href: '/dashboard/media', isLast: true }]} />

      {/* Content */}
      <div className='flex flex-col w-full h-full flex-1 overflow-hidden'>

        {/* Actions */}
        <div className='border-b flex w-full items-center p-2 gap-4'>

          <div className='flex items-center gap-2 flex-1'>
            <Button variant={'outline'} disabled={isLoading || isRefetching} onClick={() => refetch()}>
              {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
            </Button>
          </div>

          <div className='flex items-center gap-2'>
            <NewMediaDialog onCreated={() => refetch()} />
          </div>

        </div>

        {/* Grid de arquivos */}
        <div className='flex-1 overflow-auto p-4'>
          {medias.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Images className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>Nenhuma mídia ainda</EmptyTitle>
                <EmptyDescription>
                  Você ainda não adicionou nenhuma mídia. Faça upload da sua primeira mídia.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className='flex gap-2'>
                  <NewMediaDialog onCreated={() => refetch()} />
                  <Button variant={'outline'} disabled={isLoading || isRefetching} onClick={() => refetch()}>
                    {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
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
                        <span className='px-1 rounded border bg-muted/20'>{getExtension(m.name, null)}</span>
                        <span className='px-1 rounded border bg-muted/20'>{formatBytes(null)}</span>
                      </div>
                    </div>
                    <div className='opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1'>
                      <Button size={'icon'} variant={'ghost'} onClick={() => setSelected(m)}><Edit className='w-4 h-4' /></Button>
                      <DeleteMediaDialog media={m} onDeleted={() => refetch()} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer de paginação (estilo Brands) */}
        {(() => {
          const totalItems = payload.itemsTotal ?? medias.length
          const totalPages = Math.max(1, payload.pageTotal ?? Math.ceil(totalItems / Math.max(perPage, 1)))
          const startIndex = totalItems > 0 ? (payload.curPage - 1) * perPage : 0
          const endIndex = totalItems > 0 ? Math.min(startIndex + medias.length, startIndex + perPage, totalItems) : 0

          return (
            <div className='border-t h-12 w-full p-2 flex items-center'>
              <span className='text-sm'>
                Mostrando do {totalItems > 0 ? startIndex + 1 : 0} ao {endIndex} de {totalItems} itens.
              </span>

              <div className='flex items-center gap-2 flex-1 justify-end'>
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

                <span className='text-sm'>Página {payload.curPage} de {totalPages}</span>

                <Separator orientation='vertical' />

                <Button variant={'outline'} size={'icon'} onClick={() => setPage(1)} disabled={payload.curPage === 1}>
                  <ChevronsLeft />
                </Button>
                <Button variant={'outline'} size={'icon'} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={payload.curPage === 1}>
                  <ChevronLeft />
                </Button>
                <Button variant={'outline'} size={'icon'} onClick={() => setPage((p) => p + 1)} disabled={payload.curPage >= totalPages}>
                  <ChevronRight />
                </Button>
                <Button variant={'outline'} size={'icon'} onClick={() => setPage(totalPages)} disabled={payload.curPage >= totalPages}>
                  <ChevronsRight />
                </Button>
              </div>
            </div>
          )
        })()}

        {/* Dialog de edição / detalhes */}
        <EditMediaDialog media={selected} onClose={() => setSelected(null)} onSaved={() => refetch()} />

      </div>
    </div>
  )
}
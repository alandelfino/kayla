import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { X } from 'lucide-react'
import { privateInstance } from '@/lib/auth'

export function DerivationsMultiSelect({ value, onChange, disabled, enabled = true }: { value: number[]; onChange: (next: number[]) => void; disabled?: boolean; enabled?: boolean }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['derivations'],
    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:JOs6IYNo/derivations?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar derivações')
      return response.data as any
    }
  })

  const list: any[] = useMemo(() => {
    return Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? (data as any) : []
  }, [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((d: any) => String(d?.name ?? d?.title ?? '').toLowerCase().includes(q))
  }, [list, query])

  useEffect(() => { if (open) setQuery('') }, [open])

  const removeId = (id: number) => {
    const current = new Set(value || [])
    current.delete(id)
    onChange(Array.from(current))
  }

  const clearAll = () => { onChange([]) }

  const toggleId = (id: number) => {
    const current = new Set(value || [])
    if (current.has(id)) current.delete(id)
    else current.add(id)
    onChange(Array.from(current))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          ref={containerRef}
          role='combobox'
          aria-expanded={open}
          className='flex items-center gap-2 min-h-10 w-full rounded-lg border bg-background px-2 py-1 shadow-sm focus-within:ring-ring/50 focus-within:ring-[3px]'
          onClick={() => setOpen(true)}
        >
          {(value || []).map((id: number) => {
            const d = list.find((x: any) => Number(x?.id) === Number(id))
            const name = d?.name ?? d?.title ?? `#${id}`
            return (
              <span key={id} className='inline-flex items-center gap-1 rounded-md bg-neutral-900 text-white px-2.5 py-1 text-xs'>
                {name}
                <button type='button' aria-label='Remover derivação' className='ml-1 inline-flex items-center' onClick={(e) => { e.stopPropagation(); removeId(id) }} disabled={disabled}>
                  <X className='h-3 w-3' />
                </button>
              </span>
            )
          })}
          <input
            aria-label='Pesquisar derivações'
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            className='flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground'
            placeholder='Digite para pesquisar'
            disabled={disabled}
          />
          <button type='button' aria-label='Limpar seleção' className='ml-auto rounded-md p-1 hover:bg-muted' onClick={(e) => { e.stopPropagation(); clearAll() }} disabled={disabled}>
            <X className='h-4 w-4 text-foreground' />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent style={{ width: containerRef.current?.offsetWidth }} align='start' sideOffset={8}>
        <div className='flex flex-col gap-1 max-h-60 overflow-auto'>
          {isLoading ? (
            <div className='px-2 py-1.5 text-sm text-muted-foreground'>Carregando...</div>
          ) : (
            filtered.length > 0 ? (
              filtered.map((d: any) => {
                const id = typeof d?.id === 'number' ? d.id : Number(d?.id)
                const name = d?.name ?? d?.title ?? `Derivação ${id}`
                const checked = (value || []).includes(id)
                return (
                  <button
                    key={id}
                    type='button'
                    className={`flex items-center justify-between w-full rounded-md px-2 py-1 text-sm ${checked ? 'bg-muted' : 'hover:bg-muted'}`}
                    onClick={() => { toggleId(id); setQuery(''); setOpen(true) }}
                    disabled={disabled}
                  >
                    <span>{name}</span>
                    {checked ? <span className='text-xs text-muted-foreground'>Selecionado</span> : null}
                  </button>
                )
              })
            ) : (
              <div className='px-2 py-1.5 text-sm text-muted-foreground'>Nenhuma derivação encontrada</div>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DerivationsMultiSelect
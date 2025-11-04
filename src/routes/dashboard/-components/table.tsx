import { useMemo } from 'react'
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type RawCategory = {
  id: string | number
  name?: string
  nome?: string
  parent_id?: string | number | null
  children?: RawCategory[]
}

type Props = {
  data: unknown
}

export default function Table({ data }: Props) {
  // Normaliza a resposta para um array de categorias
  const categories: RawCategory[] = useMemo(() => {
    const d: any = data
    if (!d) return []
    if (Array.isArray(d)) return d as RawCategory[]
    if (Array.isArray(d.items)) return d.items as RawCategory[]
    if (Array.isArray(d.data)) return d.data as RawCategory[]
    if (Array.isArray(d.categories)) return d.categories as RawCategory[]
    return []
  }, [data])

  // Mapa para contar filhos quando o backend não envia "children"
  const childrenCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const cat of categories) {
      const parentRaw = cat.parent_id as unknown as string | number | null | undefined
      const parentId = parentRaw == null || parentRaw === 0 || parentRaw === '0' ? null : String(parentRaw)
      if (parentId) {
        map.set(parentId, (map.get(parentId) ?? 0) + 1)
      }
    }
    return map
  }, [categories])

  return (
    <div className="w-full">
      <UiTable>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="w-[140px]">Pai</TableHead>
            <TableHead className="w-[120px] text-right">Filhos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                Nenhuma categoria encontrada
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat, i) => {
              const id = String(cat.id)
              const name = cat.name ?? cat.nome ?? 'Categoria'
              const parentRaw = cat.parent_id as unknown as string | number | null | undefined
              const parentId = parentRaw == null || parentRaw === 0 || parentRaw === '0' ? null : String(parentRaw)
              const childrenCount = Array.isArray(cat.children)
                ? cat.children.length
                : childrenCountMap.get(id) ?? 0

              return (
                <TableRow key={id ?? i}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="text-muted-foreground">{parentId ?? '-'}</TableCell>
                  <TableCell className="text-right">{childrenCount}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </UiTable>
      <div className="px-1 pt-2 text-xs text-muted-foreground">Mostrando {categories.length} itens</div>
    </div>
  )
}
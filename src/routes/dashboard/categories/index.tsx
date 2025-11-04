import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { Topbar } from '../-components/topbar'
import { NewCategorySheet } from './-components/new-category'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { Edit, Funnel, RefreshCcw, Trash } from 'lucide-react'
import { EditCategorySheet } from './-components/edit-category'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/dashboard/categories/')({
  component: RouteComponent,
})

type ApiCategory = {
  id: number | string
  name?: string
  nome?: string
  parent_id?: number | string | null
  children?: ApiCategory[]
}

function RouteComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedCategories, setSelectedCategories] = useState<Array<number | string>>([])
  const [totalItems, setTotalItems] = useState(0)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['categories'],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await privateInstance.get('/api:ojk_IOB-/categories')
      if (res.status !== 200) throw new Error('Erro ao carregar categorias')
      return res.data
    },
  })

  const categories: ApiCategory[] = useMemo(() => {
    const d: any = data
    if (!d) return []
    if (Array.isArray(d)) return d as ApiCategory[]
    if (Array.isArray(d.items)) return d.items as ApiCategory[]
    if (Array.isArray(d.categories)) return d.categories as ApiCategory[]
    if (Array.isArray(d.data)) return d.data as ApiCategory[]
    return []
  }, [data])

  useEffect(() => {
    const itemsTotal = categories.length
    setTotalItems(itemsTotal)
  }, [categories])

  // Resetar seleção quando mudar de página ou atualizar
  useEffect(() => {
    setSelectedCategories([])
  }, [currentPage, perPage, isRefetching])

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

  const toggleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(categories.map((c) => c.id))
    }
  }

  const toggleSelectCategory = (id: number | string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((cid) => cid !== id))
    } else {
      setSelectedCategories([...selectedCategories, id])
    }
  }

  const columns: ColumnDef<ApiCategory>[] = [
    {
      id: 'select',
      width: '60px',
      header: () => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={categories.length > 0 && selectedCategories.length === categories.length}
            onCheckedChange={toggleSelectAll}
          />
        </div>
      ),
      cell: (cat) => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={selectedCategories.includes(cat.id)}
            onCheckedChange={() => toggleSelectCategory(cat.id)}
          />
        </div>
      ),
      headerClassName: 'w-[60px] border-r',
      className: 'font-medium border-r p-2!'
    },
    {
      id: 'name',
      header: 'Nome',
      cell: (cat) => cat.name ?? cat.nome ?? 'Categoria',
      className: 'border-r p-2!'
    },
    {
      id: 'parent',
      header: 'Pai',
      cell: (cat) => {
        const parentRaw = cat.parent_id as unknown as string | number | null | undefined
        const parentId = parentRaw == null || parentRaw === 0 || parentRaw === '0' ? null : String(parentRaw)
        return parentId ?? '-'
      },
      headerClassName: 'w-[140px] border-r',
      className: 'w-[140px] p-2!'
    },
    {
      id: 'children',
      header: 'Filhos',
      cell: (cat) => {
        const id = String(cat.id)
        const count = Array.isArray(cat.children) ? cat.children.length : (childrenCountMap.get(id) ?? 0)
        return <span className="block text-right">{count}</span>
      },
      headerClassName: 'w-[100px] border-r',
      className: 'w-[100px] p-2!'
    },
  ]

  return (
    <div className='flex flex-col w-full h-full'>

      <Topbar title="Categorias" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Categorias', href: '/dashboard/categories', isLast: true }]} />

      {/* Content */}
      <div className='flex flex-col w-full h-full flex-1 overflow-hidden'>

        {/* Actions */}
        <div className='border-b flex w-full items-center p-2 gap-4'>

          {/* Filters */}
          <div className='flex items-center gap-2 flex-1'>
            <Button variant={'outline'} size={'sm'}>
              <Funnel /> Filtros
            </Button>
          </div>

          <div className='flex items-center gap-2'>
            <Button size={'sm'} variant={'outline'} disabled={isLoading || isRefetching} onClick={() => { setSelectedCategories([]); refetch() }}>
              {
                (isLoading || isRefetching)
                  ? <><RefreshCcw className='animate-spin' /> Atualizando...</>
                  : <><RefreshCcw /> Atualizar</>
              }
            </Button>

            {selectedCategories.length === 1 ? (
              <Button size={'sm'} variant={'destructive'} disabled>
                <Trash /> Excluir
              </Button>
            ) : (
              <Button size={'sm'} variant={'ghost'} disabled>
                <Trash /> Excluir
              </Button>
            )}

            {selectedCategories.length === 1 ? (
              <EditCategorySheet categoryId={selectedCategories[0]} categories={categories} />
            ) : (
              <Button size={'sm'} variant={'ghost'} disabled>
                <Edit /> Editar
              </Button>
            )}

            <NewCategorySheet />
          </div>

        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={categories}
          loading={isLoading || isRefetching}
          page={currentPage}
          perPage={perPage}
          totalItems={totalItems}
          emptyMessage='Nenhuma categoria encontrada'
          onChange={({ page, perPage }) => {
            if (typeof page === 'number') setCurrentPage(page)
            if (typeof perPage === 'number') setPerPage(perPage)
            refetch()
          }}
        />

      </div>
    </div>
  )
}

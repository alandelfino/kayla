import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import TreeTable from './-components/tree-table'
import { Topbar } from '../-components/topbar'
import { NewCategorySheet } from './-components/new-category'

export const Route = createFileRoute('/dashboard/categories/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await privateInstance.get('/api:ojk_IOB-/categories')
      if (res.status !== 200) throw new Error('Erro ao carregar categorias')
      return res.data
    },
  })

  return (
    <div className="grid gap-6">
      <Topbar
        title="Categorias"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard', isLast: false },
          { label: 'Categorias', href: '/dashboard/categories', isLast: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Gerencie as categorias em árvore.</div>
        <NewCategorySheet />
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium">Lista de categorias</div>
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Carregando...' : 'Visualize e gerencie as categorias em estrutura hierárquica.'}
        </div>
      </div>

      <div className="border rounded-md">
        <TreeTable data={data} />
      </div>
    </div>
  )
}

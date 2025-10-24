import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, PlusIcon, Trash } from 'lucide-react'
import TreeTable from './-components/tree-table'

export const Route = createFileRoute('/dashboard/categories/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='px-4 h-full'>

      {/* Actions */}
      <div className='h-14 flex items-center justify-end gap-4'>

        <Button variant={'ghost'}>
          <Trash /> Excluir
        </Button>

        <Button variant={'ghost'}>
          <Pencil /> Editar
        </Button>

        <Button>
          <PlusIcon /> Adicionar Categoria
        </Button>

      </div>

      <TreeTable />

    </div>
  )
}

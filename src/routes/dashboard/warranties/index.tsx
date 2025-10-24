import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlusIcon, RefreshCwIcon, Trash2Icon, EditIcon, ListIcon } from 'lucide-react'
import * as React from 'react'

export const Route = createFileRoute('/dashboard/warranties/')({
  component: RouteComponent,
})

type Garantia = {
  id: string
  nome: string
  dias: number
  itens: number
}

const dadosIniciais: Garantia[] = [
  { id: '1', nome: 'Garantia 90 dias', dias: 90, itens: 8 },
  { id: '2', nome: 'Garantia 180 dias', dias: 180, itens: 5 },
  { id: '3', nome: 'Garantia 365 dias', dias: 365, itens: 11 },
]

function RouteComponent() {
  const [busca, setBusca] = React.useState('')
  const [dados, setDados] = React.useState<Garantia[]>(dadosIniciais)

  const filtrados = dados.filter((d) => {
    return busca
      ? d.nome.toLowerCase().includes(busca.toLowerCase()) || String(d.dias).includes(busca)
      : true
  })

  return (
    <div className='flex h-full flex-col'>
      {/* Breadcrumb */}
      <div className='px-4 pt-2'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Garantias</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Toolbar */}
      <div className='flex h-14 items-center gap-2 px-4'>
        <Input placeholder='Procurar...' value={busca} onChange={(e) => setBusca(e.target.value)} className='h-9 w-64' />
        <Button variant='ghost' className='ml-2'><RefreshCwIcon /> Atualizar</Button>
        <Button variant='ghost'><ListIcon /> Itens</Button>
        <Button variant='ghost'><Trash2Icon /> Excluir</Button>
        <Button variant='ghost'><EditIcon /> Editar</Button>
        <div className='ml-auto'>
          <Button><PlusIcon /> Cadastrar</Button>
        </div>
      </div>

      <Separator />

      {/* Table */}
      <div className='px-4 py-2'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-6'></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className='text-right'>Dias</TableHead>
              <TableHead className='text-right'>Itens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((d) => (
              <TableRow key={d.id}>
                <TableCell className='w-6'>
                  <input type='radio' name='sel' className='size-4 accent-primary' />
                </TableCell>
                <TableCell className='font-medium'>{d.nome}</TableCell>
                <TableCell className='text-right'>{d.dias}</TableCell>
                <TableCell className='text-right'>{d.itens}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className='px-1 pt-2 text-xs text-muted-foreground'>Mostrando {filtrados.length} de {dados.length} registros</div>
      </div>
    </div>
  )
}

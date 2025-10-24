import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { PlusIcon, RefreshCwIcon, Trash2Icon, EditIcon, ListIcon, ChevronDown } from 'lucide-react'
import * as React from 'react'

export const Route = createFileRoute('/dashboard/derivations/')({
  component: RouteComponent,
})

type Derivacao = {
  id: string
  nome: string
  nomeCatalogo: string
  tipo: 'Cor' | 'Texto'
  itens: number
}

const dadosIniciais: Derivacao[] = [
  { id: '1', nome: 'Cores', nomeCatalogo: 'Cor', tipo: 'Cor', itens: 4 },
  { id: '2', nome: 'Tamanhos (34 ao 60)', nomeCatalogo: 'Tamanhos', tipo: 'Texto', itens: 14 },
  { id: '3', nome: 'Tamanhos (PP ao EG)', nomeCatalogo: 'Tamanhos', tipo: 'Texto', itens: 6 },
]

function RouteComponent() {
  const [busca, setBusca] = React.useState('')
  const [tipo, setTipo] = React.useState<'Todos' | 'Cor' | 'Texto'>('Todos')
  const [dados, setDados] = React.useState<Derivacao[]>(dadosIniciais)

  const filtrados = dados.filter((d) => {
    const m1 = busca ? (d.nome.toLowerCase().includes(busca.toLowerCase()) || d.nomeCatalogo.toLowerCase().includes(busca.toLowerCase())) : true
    const m2 = tipo === 'Todos' ? true : d.tipo === tipo
    return m1 && m2
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
              <BreadcrumbPage>Derivações</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Toolbar */}
      <div className='flex h-14 items-center gap-2 px-4'>
        <Input placeholder='Procurar...' value={busca} onChange={(e) => setBusca(e.target.value)} className='h-9 w-64' />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='h-9'>
              Tipo <ChevronDown className='ml-1 size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            {(['Todos', 'Cor', 'Texto'] as const).map(op => (
              <DropdownMenuItem key={op} onClick={() => setTipo(op)}>
                {op}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
              <TableHead>Nome no catálogo</TableHead>
              <TableHead>Tipo</TableHead>
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
                <TableCell>{d.nomeCatalogo}</TableCell>
                <TableCell>
                  {d.tipo === 'Cor' ? (
                    <Badge variant='outline'>Cor</Badge>
                  ) : (
                    <Badge variant='outline'>Texto</Badge>
                  )}
                </TableCell>
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
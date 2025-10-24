import { createFileRoute } from '@tanstack/react-router'
import { Topbar } from '../-components/topbar'
import { Button } from '@/components/ui/button'
import { Edit, Funnel, Loader, Plus, RefreshCcw, Trash } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { NewBrandSheet } from './-components/new-brand'

export const Route = createFileRoute('/dashboard/brands/')({
  component: RouteComponent,
})

type Brand = {
  id: string
  created_at: number,
  updated_at: number,
  name: string
  company_id: number
}



function RouteComponent() {

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['brands'],
    queryFn: () => {
      return fetch('https://x8ki-letl-twmt.n7.xano.io/api:tc5G7www/brands', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('kayla-token')
        }
      })
    }
  })

  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {

    if (data) {
      data.json().then((brands) => {
        setBrands(brands)
      })
    }

  }, [data])

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar marcas')
    }
  }, [isError])

  useEffect(() => {
    if (isRefetching === true) {
      setBrands([])
    }
  }, [isRefetching])

  return (
    <div className='flex flex-col w-full h-full'>

      <Topbar title="Marcas" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Marcas', href: '/dashboard/brands', isLast: true }]} />

      {/* Content */}
      <div className='flex flex-col w-full h-full flex-1 overflow-hidden'>

        {/* Actions */}
        <div className='border-b flex w-full items-center px-4 py-4 gap-4'>

          {/* Filters */}
          <div className='flex items-center gap-2 flex-1'>

            <Button variant={'outline'} size={'sm'}>
              <Funnel /> Filtros
            </Button>

          </div>

          <div className='flex items-center gap-2'>
            <Button size={'sm'} variant={'outline'} onClick={() => refetch()}>
              {
                (isLoading || isRefetching)
                  ? <><RefreshCcw className='animate-spin' /> Atualizando...</>
                  : <><RefreshCcw /> Atualizar</>
              }
            </Button>
            <Button size={'sm'} variant={'ghost'} disabled> <Trash /> Excluir</Button>
            <Button size={'sm'} variant={'ghost'} disabled> <Edit /> Editar</Button>
            <NewBrandSheet />
          </div>

        </div>

        {/* Table */}
        <div className='flex flex-col w-full flex-1 overflow-auto'>

          <Table className='border-b h-'>

            <TableHeader className='sticky top-0 bg-neutral-50 z-10 border-b'>
              <TableRow className='bg-neutral-50'>
                <TableHead className="w-[60px] border-r">
                  <div className='flex justify-center items-center'><Checkbox /></div>
                </TableHead>
                <TableHead className='border-r'>Nome</TableHead>
                <TableHead className='w-[70px] border-r'>Produtos</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {(isLoading || isRefetching) && <TableRow>
                <TableCell colSpan={3} className='text-center'>Carregando...</TableCell>
              </TableRow>}

              {brands.length > 0 && brands.map((marca, index) => (
                <TableRow key={marca.id} className={index % 2 === 0 ? '' : 'bg-neutral-50'}>
                  <TableCell className="font-medium border-r p-2!">
                    <div className='flex justify-center items-center'><Checkbox /></div>
                  </TableCell>
                  <TableCell className='border-r p-2!'>{marca.name}</TableCell>
                  <TableCell className='w-[120px] p-2!'>{0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </div>

        {/* Table Footer */}
        <div className='border-t h-12 w-full p-2 flex items-center'>

          <span className='text-sm'>Mostrando do 1 ao 20 de 35 items.</span>

        </div>

      </div>

    </div>
  )
}

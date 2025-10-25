import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export type ColumnDef<T> = {
  id: string
  header: React.ReactNode | ((data: T[]) => React.ReactNode)
  cell: (item: T) => React.ReactNode
  width?: string
  className?: string
  headerClassName?: string
}

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  page: number
  perPage: number
  totalItems: number
  onChange: (next: { page?: number; perPage?: number }) => void
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
  page,
  perPage,
  totalItems,
  onChange,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(perPage, 1)))
  const startIndex = (page - 1) * perPage
  const endIndex = Math.min(startIndex + perPage, totalItems)

  const goToFirstPage = () => {
    if (page > 1) onChange({ page: 1 })
  }
  const goToPreviousPage = () => {
    if (page > 1) onChange({ page: page - 1 })
  }
  const goToNextPage = () => {
    if (page < totalPages) onChange({ page: page + 1 })
  }
  const goToLastPage = () => {
    if (page < totalPages) onChange({ page: totalPages })
  }

  const handlePerPageChange = (value: string) => {
    const next = parseInt(value)
    if (!Number.isNaN(next) && next !== perPage) {
      onChange({ perPage: next })
    }
  }

  return (
    <div className='flex flex-col w-full flex-1 overflow-auto'>

      <div className='h-full'>
        <Table className='border-b'>
          <TableHeader className='sticky top-0 bg-neutral-50 z-10 border-b'>
            <TableRow className='bg-neutral-50'>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={`border-r ${col.headerClassName ?? ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {typeof col.header === 'function' ? col.header(data) : col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length} className='text-center'>Carregando...</TableCell>
              </TableRow>
            )}

            {!loading && data.length > 0 && (
              <>
                {data.map((item, index) => (
                  <TableRow key={(item as any).id ?? index} className={index % 2 === 0 ? '' : 'bg-neutral-50'}>
                    {columns.map((col) => (
                      <TableCell key={col.id} className={`border-r p-2! ${col.className ?? ''}`} style={col.width ? { width: col.width } : undefined}>
                        {col.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}

            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className='text-center'>{emptyMessage}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer */}
      <div className='border-t h-12 w-full p-2 flex items-center'>
        <span className='text-sm'>
          Mostrando do {totalItems > 0 ? startIndex + 1 : 0} ao {endIndex} de {totalItems} itens.
        </span>

        <div className='flex items-center gap-2 flex-1 justify-end'>
          <span className='text-sm'>Itens por página</span>
          <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
            <SelectTrigger className='w-[90px]'>
              <SelectValue placeholder={perPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='30'>30</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Separator orientation='vertical' />

          <span className='text-sm'>Página {page} de {totalPages}</span>

          <Separator orientation='vertical' />

          <Button variant={'outline'} size={'icon'} onClick={goToFirstPage} disabled={page === 1}>
            <ChevronsLeft />
          </Button>
          <Button variant={'outline'} size={'icon'} onClick={goToPreviousPage} disabled={page === 1}>
            <ChevronLeft />
          </Button>
          <Button variant={'outline'} size={'icon'} onClick={goToNextPage} disabled={page === totalPages}>
            <ChevronRight />
          </Button>
          <Button variant={'outline'} size={'icon'} onClick={goToLastPage} disabled={page === totalPages}>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
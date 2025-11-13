import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Edit, Funnel, RefreshCcw, Trash, Users, ArrowUpRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { NewProfileSheet } from './-components/new-profile'
import { EditProfileSheet } from './-components/edit-profile'
import { DeleteProfile } from './-components/delete-profile'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'

export const Route = createFileRoute('/dashboard/settings/profiles/')({
  component: RouteComponent,
})

type Profile = {
  id: number
  created_at?: number
  updated_at?: number
  name: string
  users?: number | any
}

type ProfilesResponse = {
  itemsReceived?: number
  curPage?: number
  nextPage?: number | null
  prevPage?: number | null
  offset?: number
  perPage?: number
  itemsTotal?: number
  pageTotal?: number
  items?: Profile[]
}

function RouteComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryKey: ['profiles', currentPage, perPage],
    queryFn: async () => {
      const response = await privateInstance.get(`/api:BXIMsMQ7/user_profile?page=${currentPage}&per_page=${perPage}`)
      if (response.status !== 200) {
        throw new Error('Erro ao carregar perfis')
      }
      return response.data as ProfilesResponse
    }
  })

  const [profiles, setProfiles] = useState<Profile[]>([])

  const columns: ColumnDef<Profile>[] = [
    {
      id: 'select',
      width: '60px',
      header: (
        <div className='flex justify-center items-center text-xs text-neutral-500'>Sel.</div>
      ),
      cell: (profile) => (
        <div className='flex justify-center items-center'>
          <Checkbox
            checked={selectedProfiles.includes(profile.id)}
            onCheckedChange={() => toggleSelectProfile(profile.id)}
          />
        </div>
      ),
      headerClassName: 'w-[60px] border-r',
      className: 'font-medium border-r p-2!'
    },
    {
      id: 'name',
      header: 'Nome',
      cell: (profile) => profile.name,
      className: 'border-r p-2!'
    },
    {
      id: 'users',
      header: 'Usuários',
      width: '140px',
      cell: (profile) => {
        const users: any = (profile as any).users
        if (typeof users === 'number') return users
        if (Array.isArray(users)) return users.length
        if (users && typeof users === 'object') {
          const items = (users as any).items
          const total = (users as any).total ?? (users as any).count ?? (users as any).itemsTotal
          if (Array.isArray(items)) return items.length
          if (typeof total === 'number') return total
          return '-'
        }
        return '-'
      },
      headerClassName: 'w-[140px] max-w-[140px] border-r',
      className: 'w-[140px] max-w-[140px] p-2!'
    },
  ]

  useEffect(() => {
    if (!data) return

    const items = Array.isArray(data.items) ? data.items : []
    setProfiles(items)

    const itemsTotal = typeof data.itemsTotal === 'number' ? data.itemsTotal : items.length
    setTotalItems(itemsTotal)

    const pageTotal = typeof data.pageTotal === 'number' ? data.pageTotal : Math.max(1, Math.ceil(itemsTotal / perPage))
    setTotalPages(pageTotal)
  }, [data, perPage])

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar perfis')
    }
  }, [isError])

  useEffect(() => {
    setSelectedProfiles([])
  }, [currentPage, perPage])

  useEffect(() => {
    if (isRefetching) {
      setSelectedProfiles([])
    }
  }, [isRefetching])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const toggleSelectProfile = (profileId: number) => {
    if (selectedProfiles.includes(profileId)) {
      setSelectedProfiles([])
    } else {
      setSelectedProfiles([profileId])
    }
  }

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex flex-col w-full h-full flex-1 overflow-hidden'>
        <div className='border-b flex w-full items-center p-2 gap-4'>
          <div className='flex items-center gap-2 flex-1'>
            <Button variant={'outline'}>
              <Funnel /> Filtros
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant={'outline'} disabled={isLoading || isRefetching} onClick={() => { setSelectedProfiles([]); refetch() }}>
              {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
            </Button>

            {selectedProfiles.length === 1 ? (
              <DeleteProfile profileId={selectedProfiles[0]} />
            ) : (
              <Button variant={'ghost'} disabled>
                <Trash /> Excluir
              </Button>
            )}

            {selectedProfiles.length === 1 ? (
              <EditProfileSheet profileId={selectedProfiles[0]} />
            ) : (
              <Button variant={'ghost'} disabled>
                <Edit /> Editar
              </Button>
            )}
            <NewProfileSheet />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={profiles}
          loading={isLoading || isRefetching}
          skeletonCount={3}
          page={currentPage}
          perPage={perPage}
          totalItems={totalItems}
          emptyMessage='Nenhum perfil encontrado'
          emptySlot={(
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>Nenhum perfil ainda</EmptyTitle>
                <EmptyDescription>
                  Você ainda não criou nenhum perfil. Comece criando seu primeiro perfil.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className='flex gap-2'>
                  <NewProfileSheet />
                  <Button variant={'outline'} disabled={isLoading || isRefetching} onClick={() => { setSelectedProfiles([]); refetch() }}>
                    {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
                  </Button>
                </div>
              </EmptyContent>
              <Button
                variant='link'
                asChild
                className='text-muted-foreground'
              >
                <a href='#'>
                  Saiba mais <ArrowUpRight className='inline-block ml-1 h-4 w-4' />
                </a>
              </Button>
            </Empty>
          )}
          onChange={({ page, perPage }) => {
            if (typeof page === 'number') setCurrentPage(page)
            if (typeof perPage === 'number') setPerPage(perPage)
            refetch()
          }} />
      </div>
    </div>
  )
}
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { RefreshCcw, CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { EditUserCompanySheet } from './-components/edit-user-company'

export const Route = createFileRoute('/dashboard/settings/users/')({
  component: RouteComponent,
})

type UserCompany = {
  id: number
  created_at?: number
  company_id: number
  active?: boolean
  user: {
    id: number
    created_at?: number
    updated_at?: number
    name: string
    email: string
  }
  user_profile?: {
    id: number
    name: string
    created_at?: number
    updated_at?: number
    company_id?: number
  }
  team?: {
    id: number
    name: string
    created_at?: number
    updated_at?: number | null
    company_id?: number
  } | null
}

type UsersCompaniesResponse = {
  itemsReceived: number
  curPage: number
  nextPage: number | null
  prevPage: number | null
  offset: number
  perPage: number
  itemsTotal: number
  pageTotal: number
  items: UserCompany[]
}

function clampPerPage(value: number) {
  return Math.min(50, Math.max(20, value))
}

function RouteComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [usersCompanies, setUsersCompanies] = useState<UserCompany[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [selectedUsers, setSelectedUsers] = useState<Array<number | string>>([])

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryKey: ['users_companies', currentPage, perPage],
    queryFn: async () => {
      const response = await privateInstance.get('/api:jO41sdEd/users_companies', {
        params: { page: currentPage, per_page: clampPerPage(perPage) }
      })
      if (response.status !== 200) {
        throw new Error('Erro ao carregar usuários')
      }
      return response.data as UsersCompaniesResponse
    }
  })

  function getProp(obj: unknown, key: string): unknown {
    if (typeof obj === 'object' && obj !== null) {
      return (obj as Record<string, unknown>)[key]
    }
    return undefined
  }
  function coerceActive(v: unknown): boolean | undefined {
    if (v === true) return true
    if (v === false) return false
    if (v === 1 || v === '1') return true
    if (v === 0 || v === '0') return false
    if (v === 'true' || v === 'active') return true
    if (v === 'false' || v === 'inactive') return false
    return undefined
  }
  useEffect(() => {
    if (!data) return
    const items = Array.isArray(data.items) ? data.items : []
    const normalized = items.map((it) => {
      const candidates: unknown[] = [
        it.active,
        getProp(it.user, 'active'),
        getProp(it, 'status'),
        getProp(it.user, 'status'),
      ]
      const active = candidates.map(coerceActive).find((v) => typeof v === 'boolean')
      return { ...it, active: active ?? it.active }
    })
    setUsersCompanies(normalized)
    const itemsTotal = typeof data.itemsTotal === 'number' ? data.itemsTotal : items.length
    setTotalItems(itemsTotal)
  }, [data])

  useEffect(() => {
    if (isError) {
      console.error('Erro ao carregar usuários da empresa')
    }
  }, [isError])

  const selectedUc = selectedUsers.length === 1 ? usersCompanies.find((it) => it.user?.id === selectedUsers[0]) : undefined

  const columns: ColumnDef<UserCompany>[] = [
    {
      id: 'select',
      width: '60px',
      header: () => (<div className="flex justify-center items-center" />),
      cell: (uc) => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={!!uc.user && selectedUsers.includes(uc.user.id)}
            onCheckedChange={() => {
              const id = uc.user?.id
              if (id == null) return
              setSelectedUsers((prev) => (prev.includes(id) ? [] : [id]))
            }}
          />
        </div>
      ),
      headerClassName: 'w-[60px] border-r',
      className: 'font-medium border-r p-2!'
    },
    {
      id: 'name',
      header: 'Nome',
      cell: (uc) => uc.user?.name ?? '-',
      className: 'border-r'
    },
    {
      id: 'email',
      header: 'E-mail',
      cell: (uc) => uc.user?.email ?? '-',
      className: 'border-r'
    },
    {
      id: 'user_profile',
      header: 'Perfil',
      cell: (uc) => uc.user_profile?.name ?? '-',
      headerClassName: 'w-[160px] border-r',
      className: 'w-[160px]'
    },
    {
      id: 'team',
      header: 'Equipe',
      cell: (uc) => uc.team?.name ?? '-',
      headerClassName: 'w-[160px] border-r',
      className: 'w-[160px]'
    },
    {
      id: 'created_at',
      header: 'Criado em',
      cell: (uc) => {
        const ts = uc.user?.created_at ?? uc.created_at
        if (!ts) return '-'
        try {
          const d = new Date(ts)
          return d.toLocaleString()
        } catch {
          return String(ts)
        }
      },
      headerClassName: 'w-[200px] border-r',
      className: 'w-[200px]'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (uc) => {
        const active = uc.active === true
        return (
          <span
            className={
              active
                ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600'
                : 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-700'
            }
          >
            <span className={active ? 'h-1.5 w-1.5 rounded-full bg-green-600' : 'h-1.5 w-1.5 rounded-full bg-gray-500'} />
            {active ? 'Ativo' : 'Inativo'}
          </span>
        )
      },
      headerClassName: 'w-[140px] border-r',
      className: 'w-[140px]'
    },
    {
      id: 'actions',
      header: 'Ações',
      width: 'fit-content',
      cell: (uc) => (
        <UserCompanyActionsCell uc={uc} onChanged={() => refetch()} />
      ),
      headerClassName: 'border-r',
      className: 'border-r whitespace-nowrap'
    },
  ]

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between p-4'>
        <div className='flex flex-col'>
          <h2 className='text-lg font-semibold'>Usuários</h2>
          <p className='text-sm text-muted-foreground'>Gerencie usuários vinculados à sua conta.</p>
      </div>
        <div className='flex items-center gap-2'>
          <Button variant={'outline'} disabled={isLoading || isRefetching} onClick={() => { refetch() }}>
            {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
          </Button>
          {selectedUc ? (
            <EditUserCompanySheet uc={selectedUc} onSaved={() => refetch()} />
          ) : (
            <Button variant={'ghost'} disabled title='Editar usuário'>Editar</Button>
          )}
        </div>
      </div>
      <div className='flex flex-col w-full h-full flex-1 overflow-hidden border-t'>
        
        <DataTable
          columns={columns}
          data={usersCompanies}
          loading={isLoading || isRefetching}
          skeletonCount={3}
          page={currentPage}
          perPage={perPage}
          totalItems={totalItems}
          onChange={(next) => {
            if (typeof next.page === 'number') setCurrentPage(next.page)
            if (typeof next.perPage === 'number') setPerPage(clampPerPage(next.perPage))
          }}
          emptyMessage='Nenhum usuário encontrado'
        />
      </div>
    </div>
  )
}

function UserCompanyActionsCell({ uc, onChanged }: { uc: UserCompany, onChanged?: () => void }) {
  const isActive = uc.active === true
  const [open, setOpen] = useState(false)
  const [nextActive, setNextActive] = useState<boolean | null>(null)

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (nextActive: boolean) => {
      const url = `/api:jO41sdEd/users_companies/${uc.id}/status`
      const body = { user_company_id: uc.id, active: nextActive }
      const response = await privateInstance.put(url, body)
      if (response.status !== 200) throw new Error('Falha ao alterar status do usuário')
      return response.data
    },
    onSuccess: () => {
      toast.success('Status do usuário atualizado')
      onChanged?.()
    },
    onError: (error: unknown) => {
      let description: string | undefined
      if (typeof error === 'object' && error !== null) {
        const e = error as { response?: { data?: { message?: string } } }
        description = e.response?.data?.message
      }
      toast.error('Não permitido', {
        icon: <CircleAlert className='h-4 w-4' />,
        description: description ?? 'Erro ao atualizar usuário'
      })
    }
  })

  async function confirm(nextActive: boolean) {
    await mutateAsync(nextActive)
  }

  return (
    <>
      <Switch
        checked={isActive}
        onCheckedChange={(value) => { setNextActive(!!value); setOpen(true) }}
        disabled={isPending}
        aria-label={'Alternar status do usuário'}
        title={isActive ? 'Desativar usuário' : 'Ativar usuário'}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nextActive ? 'Ativar usuário' : 'Desativar usuário'}</DialogTitle>
            <DialogDescription>
              {nextActive
                ? 'Tem certeza que deseja ativar este usuário no workspace? Ele terá acesso ao workspace.'
                : 'Tem certeza que deseja desativar este usuário no workspace? Ele perderá acesso até ser reativado.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='flex gap-2'>
            <Button variant={'outline'} onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => { if (nextActive != null) confirm(nextActive); setOpen(false) }} disabled={isPending} variant={nextActive ? 'default' : 'destructive'}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
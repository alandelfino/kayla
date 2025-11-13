import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'
import { Edit, Loader } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

type NamedItem = { id: number, name: string }
type UserCompany = {
  id: number
  user_profile?: { id: number, name: string } | null
  team?: { id: number, name: string } | null
}

const formSchema = z.object({
  team_id: z.string().min(1, { message: 'Selecione a equipe' }),
  profile_id: z.string().min(1, { message: 'Selecione o perfil' }),
})

export function EditUserCompanySheet({ uc, onSaved }: { uc: UserCompany, onSaved?: () => void }) {
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team_id: uc.team?.id ? String(uc.team.id) : '',
      profile_id: uc.user_profile?.id ? String(uc.user_profile.id) : '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      team_id: uc.team?.id ? String(uc.team.id) : '',
      profile_id: uc.user_profile?.id ? String(uc.user_profile.id) : '',
    })
  }, [open, form, uc.team?.id, uc.user_profile?.id])

  const { data: teamsData, isLoading: isTeamsLoading } = useQuery({
    queryKey: ['teams', 'for-user-edit'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:VPDORr9u/teams?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar equipes')
      return response.data as unknown
    },
  })

  const { data: profilesData, isLoading: isProfilesLoading } = useQuery({
    queryKey: ['profiles', 'for-user-edit'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:BXIMsMQ7/user_profile?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar perfis')
      return response.data as unknown
    },
  })

  function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null
  }
  function asNamedList(raw: unknown): NamedItem[] {
    if (Array.isArray(raw)) {
      return raw.filter((v): v is NamedItem => isRecord(v) && typeof v.id === 'number' && typeof v.name === 'string')
    }
    if (isRecord(raw)) {
      const items = (raw as { items?: unknown }).items
      if (Array.isArray(items)) {
        return items.filter((v): v is NamedItem => isRecord(v) && typeof v.id === 'number' && typeof v.name === 'string')
      }
    }
    return []
  }

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const payload = {
        team_id: Number(values.team_id),
        profile_id: Number(values.profile_id),
      }
      const response = await privateInstance.put(`/api:jO41sdEd/users_companies/${uc.id}`, payload)
      if (response.status !== 200) throw new Error('Erro ao atualizar usuário')
      return response.data
    },
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!')
      setOpen(false)
      onSaved?.()
    },
    onError: (error: unknown) => {
      let message = 'Erro ao atualizar usuário'
      if (typeof error === 'object' && error !== null) {
        const e = error as { response?: { data?: { message?: string } } }
        message = e.response?.data?.message ?? message
      }
      toast.error(message)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    return mutateAsync(values)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={'ghost'} title={'Editar usuário'} aria-label={'Editar usuário'}>
          <Edit className='h-4 w-4' /> Editar
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-[520px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Editar usuário</SheetTitle>
              <SheetDescription>Atualize equipe e perfil do usuário.</SheetDescription>
            </SheetHeader>
            <div className='flex-1 grid auto-rows-min gap-6 px-4 py-4'>
              <FormField
                control={form.control}
                name='team_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipe</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isTeamsLoading}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={isTeamsLoading ? 'Carregando equipes...' : 'Selecione a equipe'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {asNamedList(teamsData).map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='profile_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isProfilesLoading}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={isProfilesLoading ? 'Carregando perfis...' : 'Selecione o perfil'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {asNamedList(profilesData).map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='mt-auto border-t p-4'>
              <div className='grid grid-cols-2 gap-4'>
                <SheetClose asChild>
                  <Button variant='outline' className='w-full'>Cancelar</Button>
                </SheetClose>
                <Button type='submit' disabled={isPending} className='w-full'>
                  {isPending ? <Loader className='animate-spin' /> : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
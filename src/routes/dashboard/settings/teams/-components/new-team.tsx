import { useState } from 'react'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'
import { Users, Loader } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nome da equipe é obrigatório' }),
})

export function NewTeamSheet({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  })

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await privateInstance.post('/api:VPDORr9u/teams', values)
      if (response.status !== 200 && response.status !== 201) throw new Error('Erro ao criar equipe')
      return response.data as Team
    },
    onSuccess: () => {
      toast.success('Equipe criada com sucesso!')
      setOpen(false)
      onCreated?.()
      form.reset({ name: '' })
    },
    onError: (error: unknown) => {
      let message = 'Erro ao criar equipe'
      if (typeof error === 'object' && error !== null) {
        const e = error as { response?: { data?: { message?: string } } }
        message = e.response?.data?.message ?? message
      }
      toast.error(message)
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await mutateAsync(values)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={'default'}>
          <Users /> Nova equipe
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-[520px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Novo equipe</SheetTitle>
              <SheetDescription>Cadastre uma nova equipe.</SheetDescription>
            </SheetHeader>

            <div className='flex-1 grid auto-rows-min gap-6 px-4 py-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder='Ex.: Suporte' {...field} />
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
                  {isPending ? <Loader className='animate-spin' /> : 'Cadastrar'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

type Team = {
  id: number
  name: string
}
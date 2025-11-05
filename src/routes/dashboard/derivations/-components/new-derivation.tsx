import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'

const formSchema = z.object({
  nome: z.string().min(1, { message: 'Nome é obrigatório' }),
  nomeCatalogo: z.string().min(1, { message: 'Nome no catálogo é obrigatório' }),
  type: z.enum(['text', 'color', 'image']),
})

export function NewDerivationSheet({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      nomeCatalogo: '',
      type: 'text',
    },
  })

  const { isPending, mutate } = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      // Adaptar payload conforme o Swagger (se os nomes diferirem)
      const payload = {
        name: values.nome,
        store_name: values.nomeCatalogo,
        type: values.type,
      }
      return privateInstance.post(`/api:JOs6IYNo/derivations`, payload)
    },
    onSuccess: (response) => {
      if (response.status === 200 || response.status === 201) {
        toast.success('Derivação cadastrada com sucesso!')
        onCreated?.()
        form.reset()
        setOpen(false)
      } else {
        toast.error('Erro ao cadastrar derivação')
      }
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Erro ao cadastrar derivação')
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size={'sm'}>
          <Plus /> Cadastrar
        </Button>
      </SheetTrigger>
      <SheetContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Cadastro de derivação</SheetTitle>
              <SheetDescription>Preencha os campos abaixo para cadastrar.</SheetDescription>
            </SheetHeader>

            <div className='flex-1 grid auto-rows-min gap-6 px-4 py-4'>
              <FormField
                control={form.control}
                name='nome'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder='Ex.: Tamanhos (PP ao EG)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='nomeCatalogo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome no catálogo</FormLabel>
                    <FormControl>
                      <Input placeholder='Ex.: Tamanhos' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecione o tipo' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value='color'>Cor</SelectItem>
                            <SelectItem value='text'>Texto</SelectItem>
                            <SelectItem value='image'>Imagem</SelectItem>
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
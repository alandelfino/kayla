import { useState } from 'react'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'
import { Loader, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nome da loja é obrigatório' }),
  description: z.string().optional().or(z.literal('')),
  price_table_id: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Tabela de preço é obrigatória' })
      .refine((v) => !Number.isNaN(v), { message: 'Tabela de preço é obrigatória' })
      .int()
  ),
})

export function NewStoreSheet({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { name: '', description: '', price_table_id: undefined },
  })

  const { data: priceTablesData, isLoading: isPriceTablesLoading } = useQuery({
    queryKey: ['price-tables'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:gI4qBCGQ/price_tables?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar tabelas de preço')
      return response.data as any
    }
  })

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const payload = { name: values.name, description: values.description ?? '', price_table_id: values.price_table_id }
      const response = await privateInstance.post('/api:gI4qBCGQ/stores', payload)
      if (response.status !== 200 && response.status !== 201) throw new Error('Erro ao criar loja')
      return response.data
    },
    onSuccess: () => {
      toast.success('Loja criada com sucesso!')
      setOpen(false)
      onCreated?.()
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      form.reset({ name: '', description: '', price_table_id: undefined })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Erro ao criar loja')
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) { await mutateAsync(values) }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={'default'}>
          <Plus /> Nova loja
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-sm'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Nova loja</SheetTitle>
              <SheetDescription>Cadastre uma nova loja.</SheetDescription>
            </SheetHeader>

            <div className='flex-1 grid auto-rows-min gap-6 px-4 py-4'>
              <FormField control={form.control} name='name' render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder='Nome da loja' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='price_table_id' render={({ field }) => (
                <FormItem>
                  <FormLabel>Tabela de preço</FormLabel>
                  <FormControl>
                    <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))} disabled={isPriceTablesLoading}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={isPriceTablesLoading ? 'Carregando tabelas...' : 'Selecione a tabela de preço'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Array.isArray((priceTablesData as any)?.items)
                            ? (priceTablesData as any).items.map((t: any) => (
                              <SelectItem key={t.id} value={String(t.id)}>{t.name ?? `Tabela #${t.id}`}</SelectItem>
                            ))
                            : Array.isArray(priceTablesData)
                              ? (priceTablesData as any).map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)}>{t.name ?? `Tabela #${t.id}`}</SelectItem>
                              ))
                              : null}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='description' render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <textarea placeholder='Opcional' {...field}
                      className='file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-28 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className='mt-auto border-t p-4'>
              <div className='grid grid-cols-2 gap-4'>
                <SheetClose asChild>
                  <Button variant='outline' className='w-full'>Cancelar</Button>
                </SheetClose>
                <Button type='submit' disabled={isPending} className='w-full'>
                  {isPending ? <Loader className='animate-spin' /> : 'Salvar loja'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
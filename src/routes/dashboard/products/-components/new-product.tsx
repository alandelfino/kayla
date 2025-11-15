import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader, PackagePlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'
import { Switch } from '@/components/ui/switch'
import { useEffect, useState, useRef } from 'react'
import { maskMoneyInput, toCents, formatMoneyFromCents } from '@/lib/format'

const formSchema = z.object({
  sku: z.string().min(1, { message: 'Campo obrigatório' }),
  name: z.string().min(1, { message: 'Campo obrigatório' }),
  description: z.string().optional().or(z.literal('')),
  type: z.enum(['simple', 'with_derivations'] as const, { message: 'Campo obrigatório' }),
  price: z.preprocess((v) => typeof v === 'number' ? v : toCents(v), z.number({ message: 'Campo obrigatório' }).int().min(0)),
  promotional_price: z.preprocess((v) => typeof v === 'number' ? v : toCents(v), z.number().int().min(0)).optional(),
  stock: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const cleaned = v.replace(/[^0-9,.-]/g, '').replace(',', '.')
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Campo obrigatório' })
      .refine((v) => !Number.isNaN(v), { message: 'Informe um número válido' })
      .min(0, { message: 'Informe um número válido' })
  ),
  active: z.boolean({ message: 'Campo obrigatório' }),
  promotional_price_active: z.boolean({ message: 'Campo obrigatório' }),
  managed_inventory: z.boolean({ message: 'Campo obrigatório' }),
  unit_id: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Campo obrigatório' })
      .refine((v) => !Number.isNaN(v), { message: 'Campo obrigatório' })
      .int()
  ),
  brand_id: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Campo obrigatório' })
      .refine((v) => !Number.isNaN(v), { message: 'Campo obrigatório' })
      .int()
  ),
  derivation_ids: z.array(z.number()).default([]),
}).superRefine((data, ctx) => {
  if (data.type === 'with_derivations' && (!data.derivation_ids || data.derivation_ids.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['derivation_ids'], message: 'Selecione pelo menos uma derivação' })
  }
})

export function NewProductSheet({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      type: 'simple',
      price: undefined,
      promotional_price: undefined,
      stock: undefined,
      active: true,
      promotional_price_active: false,
      managed_inventory: false,
      unit_id: undefined,
      brand_id: undefined,
      derivation_ids: [],
    }
  })

  const derivationsTriggerRef = useRef<HTMLButtonElement>(null)

  const { isPending, mutate } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await privateInstance.post('/api:c3X9fE5j/products', values)
      return response
    },
    onSuccess: (response) => {
      if (response.status === 200 || response.status === 201) {
        toast.success('Produto criado com sucesso!')
        setOpen(false)
        form.reset()
        onCreated?.()
        queryClient.invalidateQueries({ queryKey: ['products'] })
      } else {
        toast.error('Erro ao salvar produto')
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Erro ao criar produto')
    }
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values)
  }

  // Carregar marcas e unidades do backend (Xano Products API)
  const { data: brandsData, isLoading: isBrandsLoading } = useQuery({
    queryKey: ['brands'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:tc5G7www/brands?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar marcas')
      return response.data as any
    }
  })

  const { data: unitsData, isLoading: isUnitsLoading } = useQuery({
    queryKey: ['units'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:-b71x_vk/unit_of_measurement?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar unidades')
      return response.data as any
    }
  })

  // Carregar derivações
  const { data: derivationsData, isLoading: isDerivationsLoading } = useQuery({
    queryKey: ['derivations'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:JOs6IYNo/derivations?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar derivações')
      return response.data as any
    }
  })

  // Helpers de máscara
  function currencyMask(val: string) { return maskMoneyInput(val) }
  function getUnitsArray(data: any): any[] {
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data)) return data
    return []
  }
  function findUnitTypeById(data: any, id?: number) {
    if (!id) return undefined
    const arr = getUnitsArray(data)
    const found = arr.find((u: any) => Number(u?.id) === Number(id))
    return found?.type as string | undefined
  }
  function stockMask(val: string, unitType?: string) {
    let decimals = 0
    if (unitType && /decimal/i.test(unitType)) {
      const m = unitType.match(/(\d+)/)
      decimals = m ? parseInt(m[1], 10) : 2
    }
    const digits = (val || '').replace(/\D/g, '')
    if (!digits) return { text: '', value: undefined as number | undefined }
    if (decimals === 0) {
      const num = Number(digits)
      return { text: num.toLocaleString('pt-BR'), value: num }
    }
    const num = Number(digits) / Math.pow(10, decimals)
    return { text: num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }), value: num }
  }
  function formatStockFromNumber(num?: number, unitType?: string) {
    if (typeof num !== 'number') return ''
    let decimals = 0
    if (unitType && /decimal/i.test(unitType)) {
      const m = unitType.match(/(\d+)/)
      decimals = m ? parseInt(m[1], 10) : 2
    }
    return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  // Estados de exibição mascarada
  const [priceText, setPriceText] = useState('')
  const [promoPriceText, setPromoPriceText] = useState('')
  const [stockText, setStockText] = useState('')
  const unitId = form.watch('unit_id')
  const unitType = findUnitTypeById(unitsData, unitId)

  useEffect(() => {
    // Inicializa textos ao abrir/fechar e quando muda unidade
    const p = form.getValues('price')
    const pp = form.getValues('promotional_price')
    const s = form.getValues('stock')
    setPriceText(formatMoneyFromCents(p))
    setPromoPriceText(formatMoneyFromCents(pp))
    setStockText(formatStockFromNumber(s, unitType))
  }, [open, unitType])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={'default'}>
          <PackagePlus /> Novo produto
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-[800px] md:max-w-[700px] lg:max-w-[600px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Novo produto</SheetTitle>
              <SheetDescription>Cadastre um novo produto no catálogo.</SheetDescription>
            </SheetHeader>

            <div className='flex-1 px-4 py-4'>
              <Tabs defaultValue='geral' className='flex-1'>
                <TabsList>
                  <TabsTrigger value='geral' className='px-4'>Geral</TabsTrigger>
                  <TabsTrigger value='descricao' className='px-4'>Descrição</TabsTrigger>
                </TabsList>

                <TabsContent value='geral'>
                  <div className='grid auto-rows-min gap-6'>
                    <div className='grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4'>
                      <FormField control={form.control} name='sku' render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Código interno do produto'
                              className='min-w-[120px] w-[150px] max-w-[150px]'
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='name' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input className='w-full' placeholder='Nome do produto' {...field} disabled={isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {form.watch('type') === 'with_derivations' && (
                      <FormField control={form.control} name='derivation_ids' render={({ field }) => {
                        const selectedIds = field.value || []
                        const derivations = Array.isArray((derivationsData as any)?.items)
                          ? (derivationsData as any).items
                          : Array.isArray(derivationsData)
                            ? (derivationsData as any)
                            : []
                        return (
                          <FormItem>
                            <FormLabel>Derivações</FormLabel>
                            <FormControl>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button ref={derivationsTriggerRef} type='button' variant='outline' disabled={isDerivationsLoading || isPending} className='justify-between w-full'>
                                    {selectedIds.length > 0 ? `${selectedIds.length} selecionada(s)` : 'Selecione as derivações'}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent style={{ width: derivationsTriggerRef.current?.offsetWidth }}>
                                  <DropdownMenuLabel>Disponíveis</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {isDerivationsLoading && (
                                    <div className='px-2 py-1.5 text-sm text-muted-foreground'>Carregando...</div>
                                  )}
                                  {!isDerivationsLoading && derivations?.length === 0 && (
                                    <div className='px-2 py-1.5 text-sm text-muted-foreground'>Nenhuma derivação encontrada</div>
                                  )}
                                  {derivations?.map((d: any) => {
                                    const id = typeof d?.id === 'number' ? d.id : Number(d?.id)
                                    const name = d?.name ?? d?.title ?? `Derivação ${id}`
                                    const checked = selectedIds.includes(id)
                                    return (
                                      <DropdownMenuCheckboxItem key={id} checked={checked}
                                        onCheckedChange={(next) => {
                                          const current = new Set(selectedIds)
                                          if (next) current.add(id)
                                          else current.delete(id)
                                          const nextArr = Array.from(current)
                                          form.setValue('derivation_ids', nextArr, { shouldDirty: true, shouldValidate: true })
                                        }}
                                      >
                                        {name}
                                      </DropdownMenuCheckboxItem>
                                    )
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )
                      }} />
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <FormField control={form.control} name='type' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Selecione o tipo' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value='simple'>Simples</SelectItem>
                                  <SelectItem value='with_derivations'>Com variações</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='price' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço</FormLabel>
                          <FormControl>
                            <Input type='text' inputMode='numeric' placeholder='R$ 0,00' value={priceText}
                              onChange={(e) => {
                                const { text, value } = currencyMask(e.target.value)
                                setPriceText(text)
                                field.onChange(value)
                              }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='stock' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque</FormLabel>
                          <FormControl>
                            <Input type='text' inputMode='numeric' placeholder={unitType && /decimal/i.test(unitType) ? '0,00' : '0'} value={stockText}
                              onChange={(e) => {
                                const { text, value } = stockMask(e.target.value, unitType)
                                setStockText(text)
                                field.onChange(value)
                              }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <FormField control={form.control} name='promotional_price' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço promocional</FormLabel>
                          <FormControl>
                            <Input type='text' inputMode='numeric' placeholder='R$ 0,00' value={promoPriceText}
                              onChange={(e) => {
                                const { text, value } = currencyMask(e.target.value)
                                setPromoPriceText(text)
                                field.onChange(value)
                              }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='unit_id' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <FormControl>
                            <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))} disabled={isUnitsLoading}>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={isUnitsLoading ? 'Carregando unidades...' : 'Selecione a unidade'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {Array.isArray((unitsData as any)?.items)
                                    ? (unitsData as any).items.map((u: any) => (
                                      <SelectItem key={u.id} value={String(u.id)}>{u.name ?? `Unidade #${u.id}`}</SelectItem>
                                    ))
                                    : Array.isArray(unitsData)
                                      ? (unitsData as any).map((u: any) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name ?? `Unidade #${u.id}`}</SelectItem>
                                      ))
                                      : null}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='brand_id' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca</FormLabel>
                          <FormControl>
                            <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))} disabled={isBrandsLoading}>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={isBrandsLoading ? 'Carregando marcas...' : 'Selecione a marca'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {Array.isArray((brandsData as any)?.items)
                                    ? (brandsData as any).items.map((b: any) => (
                                      <SelectItem key={b.id} value={String(b.id)}>{b.name ?? `Marca #${b.id}`}</SelectItem>
                                    ))
                                    : Array.isArray(brandsData)
                                      ? (brandsData as any).map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name ?? `Marca #${b.id}`}</SelectItem>
                                      ))
                                      : null}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className='grid grid-cols-1 gap-4'>
                      <FormField control={form.control} name='active' render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 rounded-md'>
                            <div className='flex flex-col gap-0.5'>
                              <FormLabel>Ativo</FormLabel>
                              <FormDescription className='leading-snug'>Quando habilitado, o produto aparece ativo no catálogo.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={isPending} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='promotional_price_active' render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 rounded-md'>
                            <div className='flex flex-col gap-0.5'>
                              <FormLabel>Promoção ativa</FormLabel>
                              <FormDescription className='leading-snug'>Aplica o preço promocional quando disponível.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={isPending} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='managed_inventory' render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 rounded-md'>
                            <div className='flex flex-col gap-0.5'>
                              <FormLabel>Gerenciar estoque</FormLabel>
                              <FormDescription className='leading-snug'>Controla o estoque automaticamente para vendas e entradas.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={isPending} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='descricao'>
                  <div className='grid auto-rows-min gap-6'>
                    <FormField control={form.control} name='description' render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <textarea placeholder='Opcional' {...field} disabled={isPending}
                            className='file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-28 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </TabsContent>

              </Tabs>
            </div>

            <div className='mt-auto border-t p-4'>
              <div className='grid grid-cols-2 gap-4'>
                <SheetClose asChild>
                  <Button variant='outline' className='w-full'>Cancelar</Button>
                </SheetClose>
                <Button type='submit' disabled={isPending} className='w-full'>
                  {isPending ? <Loader className='animate-spin' /> : 'Salvar produto'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '../-components/topbar'
import { publicInstance, privateInstance } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RefreshCcw, Building2, Loader2, Save, Edit } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarAbbrev } from '@/lib/utils'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from '@/components/ui/shadcn-io/image-crop'

export const Route = createFileRoute('/dashboard/company-profile/')({
  component: RouteComponent,
})

type VaultImage = {
  access?: string
  path?: string
  name?: string
  type?: string
  size?: number
  mime?: string
  meta?: { width?: number; height?: number }
  url?: string
} | null

type CompanyProfile = {
  id: number
  created_at?: number
  updated_At?: number
  name?: string
  user_id?: number
  alias?: string
  website?: string
  country?: string
  time_zone?: string
  segment?: string
  date_format?: string
  currency?: string
  number_format?: string
  image?: VaultImage
}

function getSubdomain() { return window.location.hostname.split('.')[0] }

function RouteComponent() {
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removedLogo, setRemovedLogo] = useState<boolean>(false)
  const [cropOpen, setCropOpen] = useState<boolean>(false)
  const originalFileRef = useRef<File | null>(null)
  // Removido o sheet; edição ocorre diretamente na página

  const formSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    website: z.string().optional().default(''),
    country: z.string().optional().default(''),
    time_zone: z.string().optional().default('America/Sao_Paulo'),
    segment: z.string().optional().default(''),
    date_format: z.string().optional().default('dd/mm/yyyy-HH:mm:ss'),
    currency: z.string().optional().default('BRL'),
    number_format: z.string().optional().default('0.000,00'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      name: '',
      website: '',
      country: '',
      time_zone: 'America/Sao_Paulo',
      segment: '',
      date_format: 'dd/mm/yyyy-HH:mm:ss',
      currency: 'BRL',
      number_format: '0.000,00',
    },
  })

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ['company-profile'],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const res = await privateInstance.get('/api:kdrFy_tm/companies/single')
      if (res.status !== 200) {
        throw new Error(res?.data?.message ?? 'Erro ao carregar dados da empresa')
      }
      const payload = res.data as any
      // Normaliza para o formato esperado e aplica defaults conforme solicitado
      const normalized: CompanyProfile = {
        id: Number(payload?.id ?? 3),
        created_at: Number(payload?.created_at ?? 1762798128984),
        updated_At: Number(payload?.updated_At ?? 1762798129000),
        name: String(payload?.name ?? 'Di Véus'),
        user_id: Number(payload?.user_id ?? 4),
        alias: String(payload?.alias ?? 'diveus'),
        website: String(payload?.website ?? ''),
        country: String(payload?.country ?? 'Brazil'),
        time_zone: String(payload?.time_zone ?? 'America/Sao_Paulo'),
        segment: String(payload?.segment ?? ''),
        date_format: String(payload?.date_format ?? 'dd/mm/yyyy-HH:mm:ss'),
        currency: String(payload?.currency ?? 'BRL'),
        number_format: String(payload?.number_format ?? '0.000,00'),
        // Se a API retornar image como null, respeitamos e não aplicamos imagem padrão
        image: payload?.image ?? null,
      }
      return normalized
    }
  })

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar dados da empresa')
    }
  }, [isError])

  useEffect(() => {
    if (!data) return
    setCompany(data)
    setPreviewUrl(data?.image?.url ?? null)
    // Se o backend retorna image === null, limpamos qualquer seleção/preview local
    if (data?.image === null) {
      try {
        setSelectedFile(null)
        setRemovedLogo(false)
      } catch {}
    }
    // Preenche o formulário com os valores atuais
    form.reset({
      name: data?.name ?? '',
      website: data?.website ?? '',
      country: data?.country ?? '',
      time_zone: data?.time_zone ?? 'America/Sao_Paulo',
      segment: data?.segment ?? '',
      date_format: data?.date_format ?? 'dd/mm/yyyy-HH:mm:ss',
      currency: data?.currency ?? 'BRL',
      number_format: data?.number_format ?? '0.000,00',
    })
    // Atualiza dados locais para uso em sidebar e outras áreas
    try {
      const sub = getSubdomain()
      localStorage.setItem(`${sub}-kayla-company`, JSON.stringify(data))
      // Opcional: notificar UI de atualização (caso algum componente escute)
      try { window.dispatchEvent(new CustomEvent('kayla:company-updated', { detail: data })) } catch {}
    } catch {}
  }, [data])

  function handlePickLogo() {
    fileInputRef.current?.click()
  }

  async function cropImageToSquare(file: File, targetSize?: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        try {
          const size = Math.min(img.width, img.height)
          const sx = Math.floor((img.width - size) / 2)
          const sy = Math.floor((img.height - size) / 2)
          const canvas = document.createElement('canvas')
          const finalSize = targetSize && targetSize > 0 ? targetSize : size
          canvas.width = finalSize
          canvas.height = finalSize
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas indisponível')
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, sx, sy, size, size, 0, 0, finalSize, finalSize)
          canvas.toBlob((blob) => {
            try { URL.revokeObjectURL(objectUrl) } catch {}
            if (!blob) {
              reject(new Error('Falha ao processar imagem'))
              return
            }
            const croppedFile = new File([blob], `${(file.name || 'logo').replace(/\.[^/.]+$/, '')}-cropped.png`, { type: 'image/png' })
            resolve(croppedFile)
          }, 'image/png', 0.92)
        } catch (err) {
          try { URL.revokeObjectURL(objectUrl) } catch {}
          reject(err as any)
        }
      }
      img.onerror = (err) => {
        try { URL.revokeObjectURL(objectUrl) } catch {}
        reject(err as any)
      }
      img.src = objectUrl
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const MAX_SIZE = 10 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        toast.error('Arquivo muito grande. Tamanho máximo permitido é 10MB.')
        return
      }
      setRemovedLogo(false)
      originalFileRef.current = file
      setCropOpen(true)
    } catch {
      toast.error('Falha ao carregar a imagem da logo')
    }
  }

  // Handler para integrar o crop do shadcn-io
  async function handleShadcnCrop(croppedDataUrl: string) {
    try {
      const resp = await fetch(croppedDataUrl)
      const blob = await resp.blob()
      const fileName = (originalFileRef.current?.name || 'logo').replace(/\.[^/.]+$/, '') + '-cropped.png'
      const croppedFile = new File([blob], fileName, { type: 'image/png' })

      // Pré-visualização e estado local
      setPreviewUrl(croppedDataUrl)
      setSelectedFile(croppedFile)

      // Atualiza localStorage para refletir no sidebar
      const sub = getSubdomain()
      const raw = localStorage.getItem(`${sub}-kayla-company`)
      let localCompany: any = null
      try { localCompany = raw ? JSON.parse(raw) : null } catch { localCompany = null }
      const nextCompany = { ...(localCompany ?? {}), image: { ...(localCompany?.image ?? {}), url: croppedDataUrl } }
      localStorage.setItem(`${sub}-kayla-company`, JSON.stringify(nextCompany))
      try { window.dispatchEvent(new CustomEvent('kayla:company-updated', { detail: nextCompany })) } catch {}

      setCropOpen(false)
    } catch {
      toast.error('Falha ao aplicar recorte da imagem')
      setCropOpen(false)
    }
  }

  function handleRemoveLogo() {
    try {
      setRemovedLogo(true)
      setSelectedFile(null)
      setPreviewUrl(null)
      const sub = getSubdomain()
      const raw = localStorage.getItem(`${sub}-kayla-company`)
      let localCompany: any = null
      try { localCompany = raw ? JSON.parse(raw) : null } catch { localCompany = null }
      const nextCompany = { ...(localCompany ?? {}), image: { ...(localCompany?.image ?? {}), url: null } }
      localStorage.setItem(`${sub}-kayla-company`, JSON.stringify(nextCompany))
      try { window.dispatchEvent(new CustomEvent('kayla:company-updated', { detail: nextCompany })) } catch {}
    } catch {}
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const fd = new FormData()
      fd.append('name', values.name)
      fd.append('website', values.website ?? '')
      fd.append('country', values.country ?? '')
      fd.append('time_zone', values.time_zone ?? 'America/Sao_Paulo')
      fd.append('segment', values.segment ?? '')
      fd.append('date_format', values.date_format ?? 'dd/mm/yyyy-HH:mm:ss')
      fd.append('currency', values.currency ?? 'BRL')
      fd.append('number_format', values.number_format ?? '0.000,00')
      if (selectedFile) {
        fd.append('file', selectedFile, selectedFile.name)
      }
      if (removedLogo) {
        fd.append('remove_file', '1')
      }

      // Alinhar configuração com cadastro de mídia: multipart/form-data explícito
      const res = await privateInstance.put(
        '/api:kdrFy_tm/companies',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      if (res.status >= 200 && res.status < 300) {
        // Atualiza imediatamente a logo e dados locais para refletir no sidebar
        try {
          const payload = res.data as any
          const sub = getSubdomain()
          const nextCompany: CompanyProfile = {
            ...(company ?? {} as CompanyProfile),
            ...(payload ?? {}),
          } as CompanyProfile
          // Atualiza preview com a URL final do servidor, caso exista
          const finalUrl = nextCompany?.image?.url ?? payload?.image?.url ?? null
          if (finalUrl) setPreviewUrl(finalUrl)
          setCompany(nextCompany)
          localStorage.setItem(`${sub}-kayla-company`, JSON.stringify(nextCompany))
          try { window.dispatchEvent(new CustomEvent('kayla:company-updated', { detail: nextCompany })) } catch {}
        } catch {}

        toast.success('Dados da empresa atualizados!')
        // Após atualização, refetch para obter imagem/valores definitivos
        try {
          await refetch()
        } catch {}
      } else {
        toast.error('Erro ao atualizar os dados da empresa')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro ao atualizar os dados da empresa'
      toast.error(msg)
    }
  }

  return (
    <div className='flex flex-col w-full h-full'>
      <Topbar title="Perfil da Empresa" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Perfil da Empresa', href: '/dashboard/company-profile', isLast: true }]} />

      <div className='flex flex-col w-full h-full flex-1 overflow-auto p-6 gap-6'>
        <div className='w-full max-w-[1024px] mx-auto space-y-6'>

        {/* Cabeçalho simples */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Building2 className='h-10 w-10 p-2 text-white bg-neutral-800 rounded-lg' />
            <div className='flex flex-col'>
              <span className='text-md font-medium'>Detalhes da empresa</span>
              <span className='text-sm text-muted-foreground'>Vamos configurar seus dados.</span>
            </div>
          </div>
          
        </div>

        {isLoading ? (
          <div className='flex flex-col gap-6'>
            {/* Logo / Upload (skeleton) */}
            <div className='grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4'>
              <div className='text-xs font-medium text-muted-foreground'>
                <Skeleton className='h-4 w-28' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-14 w-14 rounded-2xl' />
                <Skeleton className='h-9 w-28' />
              </div>
            </div>

            {/* Informações principais (skeleton) */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className='flex flex-col gap-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-9 w-full' />
                </div>
              ))}
            </div>

            {/* Ações no final do conteúdo (skeleton) */}
            <div className='flex w-full justify-end items-center'>
              <Skeleton className='h-9 w-24' />
            </div>
          </div>
        ) : company ? (
          <Form {...form}>
            <form id='company-edit-form' className='flex flex-col gap-6' onSubmit={form.handleSubmit(async (vals) => { await onSubmit(vals) })}>
              {/* Logo / Upload */}
              <div className='grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4'>
                <div className='text-xs font-medium text-muted-foreground'>Logo da empresa</div>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    className='group relative cursor-pointer'
                    onClick={handlePickLogo}
                    title='Clique para escolher uma imagem'
                    aria-label='Alterar logo'
                  >
                    <Avatar className='h-14 w-14 rounded-2xl'>
                      <AvatarImage src={previewUrl || undefined} alt={company?.name || ''} />
                      <AvatarFallback className='rounded-2xl'>
                        {getAvatarAbbrev(company?.name ?? 'Empresa')}
                      </AvatarFallback>
                    </Avatar>
                    {/* Overlay de edição ao passar o mouse */}
                    <div className='absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center'>
                      <Edit className='h-4 w-4 text-white' />
                    </div>
                  </button>
                  <input ref={fileInputRef} type='file' accept='image/jpeg,image/png,image/webp' className='hidden' onChange={handleFileChange} />
                  {(previewUrl || (company?.image?.url && !removedLogo)) && (
                    <Button variant='ghost' size='sm' type='button' className='text-xs font-light text-muted-foreground' onClick={handleRemoveLogo}>Remover logo</Button>
                  )}
                </div>
              </div>

              {/* Informações principais */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField control={form.control} name='name' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da empresa</FormLabel>
                    <FormControl>
                      <Input placeholder='Nome da empresa' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='website' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder='https://exemplo.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='segment' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento</FormLabel>
                    <FormControl>
                      <Input placeholder='Segmento da empresa' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Selects: país, fuso, moeda, formatos */}
                <FormField control={form.control} name='country' render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecione o país' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Brazil'>Brasil</SelectItem>
                        <SelectItem value='United States'>Estados Unidos</SelectItem>
                        <SelectItem value='Portugal'>Portugal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='time_zone' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuso horário</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecione o fuso horário' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='America/Sao_Paulo'>America/Sao_Paulo</SelectItem>
                        <SelectItem value='America/New_York'>America/New_York</SelectItem>
                        <SelectItem value='Europe/Lisbon'>Europe/Lisbon</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='currency' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecione a moeda' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='BRL'>BRL</SelectItem>
                        <SelectItem value='USD'>USD</SelectItem>
                        <SelectItem value='EUR'>EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='date_format' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato de data</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecione o formato de data' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='dd/mm/yyyy'>dd/mm/yyyy</SelectItem>
                        <SelectItem value='mm/dd/yyyy'>mm/dd/yyyy</SelectItem>
                        <SelectItem value='dd/mm/yyyy-HH:mm:ss'>dd/mm/yyyy-HH:mm:ss</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='number_format' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato numérico</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecione o formato numérico' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='0.000,00'>0.000,00</SelectItem>
                        <SelectItem value='0,000.00'>0,000.00</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Ações no final do conteúdo */}
              <div className='flex w-full justify-end items-center'>
                <Button size='sm' type='submit' disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <span className='inline-flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Salvando...
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-2'>
                      <Save className='h-4 w-4' />
                      Salvar
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className='text-sm text-muted-foreground'>Nenhum dado disponível</div>
        )}
        </div>
      </div>

      {/* Dialog de Crop da logo */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Recortar logo</DialogTitle>
          </DialogHeader>
          {originalFileRef.current ? (
            <ImageCrop file={originalFileRef.current} aspect={1} maxImageSize={1024 * 1024 * 5} onCrop={handleShadcnCrop}>
              <div className='space-y-4'>
                <ImageCropContent className='max-h-[300px]' />
                <div className='flex justify-end gap-2'>
                  <ImageCropReset asChild>
                    <Button variant={'ghost'}>Resetar</Button>
                  </ImageCropReset>
                  <ImageCropApply asChild>
                    <Button>Aplicar recorte</Button>
                  </ImageCropApply>
                </div>
              </div>
            </ImageCrop>
          ) : (
            <div className='text-sm text-muted-foreground'>Selecione uma imagem para recortar.</div>
          )}
          <DialogFooter>
            <Button variant={'outline'} onClick={() => setCropOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
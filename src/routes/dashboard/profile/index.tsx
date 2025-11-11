import { createFileRoute } from '@tanstack/react-router'
import { Topbar } from '../-components/topbar'
import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarAbbrev } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageCrop, ImageCropContent, ImageCropApply, ImageCropReset } from '@/components/ui/shadcn-io/image-crop'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'
import { Loader, Mail, User, Lock, Trash, Save } from 'lucide-react'

export const Route = createFileRoute('/dashboard/profile/')({
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

type MeResponse = {
  id: number
  name?: string
  email?: string
  image?: VaultImage
}

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  image: z.any().optional(),
})

function getSubdomain() {
  return window.location.hostname.split('.')[0]
}

  function RouteComponent() {
  const [loadingMe, setLoadingMe] = useState<boolean>(true)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState<boolean>(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [scale, setScale] = useState<number>(1)
  const [offsetX, setOffsetX] = useState<number>(0)
  const [offsetY, setOffsetY] = useState<number>(0)
  const [dragging, setDragging] = useState<boolean>(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastBlobUrlRef = useRef<string | null>(null)
  // Guarda arquivo original selecionado para preservar MIME/EXT quando recortar
  const originalFileRef = useRef<File | null>(null)
  // Flag para indicar remoção do avatar
  const [removeImage, setRemoveImage] = useState<boolean>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      name: '',
      image: undefined,
    },
  })

  // Carrega dados iniciais do usuário
  useEffect(() => {
    async function loadMe() {
      try {
        setLoadingMe(true)
        // Tenta primeiro do localStorage
        const subdomain = getSubdomain()
        const raw = localStorage.getItem(`${subdomain}-kayla-user`)
        let localUser: any = null
        try { localUser = raw ? JSON.parse(raw) : null } catch { localUser = null }

        if (localUser && localUser.id) {
          // Usa dados locais imediatamente para evitar flicker
          setMe({ id: localUser.id, name: localUser.name ?? '', email: localUser.email ?? '', image: localUser.image ?? null })
          form.reset({ name: localUser.name ?? '' })
          setPreviewUrl(localUser.image?.url ?? localUser.avatar_url ?? null)

          // Se não houver imagem no localStorage, busca do backend para atualizar
          const hasLocalImage = Boolean(
            (localUser?.image?.url && !String(localUser?.image?.url).startsWith('blob:'))
            || localUser?.avatar_url
          )
          if (!hasLocalImage) {
            try {
  const res = await privateInstance.get('/api:eA5lqIuH/auth/me')
              if (res.status === 200) {
                const data = Array.isArray(res.data) ? (res.data[0] ?? null) : res.data
                if (data?.id) {
                  const meData: MeResponse = { id: data.id, name: data.name ?? '', email: data.email ?? '', image: data.image ?? null }
                  setMe(meData)
                  form.reset({ name: meData.name ?? '' })
                  setPreviewUrl(meData.image?.url ?? data?.avatar_url ?? null)
                  // Atualiza localStorage com dados mais recentes, incluindo imagem
                  try {
                    const nextUser = { ...(localUser ?? {}), name: meData.name, email: meData.email, image: meData.image }
                    localStorage.setItem(`${subdomain}-kayla-user`, JSON.stringify(nextUser))
                  } catch {}
                }
              }
            } catch {}
          }
        } else {
          // Fallback: consulta ao backend
  const res = await privateInstance.get('/api:eA5lqIuH/auth/me')
          if (res.status === 200) {
            const data = Array.isArray(res.data) ? (res.data[0] ?? null) : res.data
            if (data?.id) {
              const meData: MeResponse = { id: data.id, name: data.name ?? '', email: data.email ?? '', image: data.image ?? null }
              setMe(meData)
              form.reset({ name: meData.name ?? '' })
              setPreviewUrl(meData.image?.url ?? data?.avatar_url ?? null)
              // Persiste no localStorage para os próximos carregamentos
              try {
                localStorage.setItem(`${subdomain}-kayla-user`, JSON.stringify({ id: meData.id, name: meData.name, email: meData.email, image: meData.image }))
              } catch {}
            }
          } else {
            toast.error('Não foi possível carregar seus dados')
          }
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Erro ao carregar seu perfil')
      } finally {
        setLoadingMe(false)
      }
    }
    loadMe()
  }, [])

  const userId = useMemo(() => me?.id ?? null, [me])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const fd = new FormData()
      fd.append('name', values.name)
      const imageVal: File | undefined = values.image instanceof FileList ? values.image.item(0) ?? undefined : (values.image as File | undefined)
      const uploadFile: File | undefined = removeImage ? undefined : imageVal
      // Validação básica do arquivo gerado pelo crop
      if (uploadFile && (uploadFile.size === 0 || !uploadFile.type)) {
        toast.error('Falha ao gerar a imagem recortada. Tente novamente.')
        return
      }
      if (uploadFile) {
        // Backend (Xano) espera o parâmetro 'file' conforme o erro retornado.
        // Anexa explicitamente o nome do arquivo para Content-Disposition
        fd.append('file', uploadFile, uploadFile.name)
      }
      // Se usuário removeu a imagem, sinaliza ao backend
      if (removeImage) {
        fd.append('remove_file', 'true')
      }

      // Endpoint não precisa mais do {user_id}; backend infere pelo token
      // Alinha com new-media-dialog: define explicitamente multipart/form-data no cabeçalho
  const res = await privateInstance.put('/api:paM0Fhtw/users', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

      if (res.status >= 200 && res.status < 300) {
        toast.success('Perfil atualizado!')
        // Atualiza localStorage e sidebar (avatar e nome)
        try {
          const subdomain = getSubdomain()
          const raw = localStorage.getItem(`${subdomain}-kayla-user`)
          let localUser: any = null
          try { localUser = raw ? JSON.parse(raw) : null } catch { localUser = null }

          // Tenta usar a imagem retornada pela API; se não vier, usa o preview atual como um placeholder imediato
          const updatedImage = removeImage ? null : (res?.data?.image ?? null)
          const oldUrl: string | null = (localUser?.image?.url ?? me?.image?.url ?? null) as string | null
          // Se a resposta ainda contiver a URL antiga (processamento não concluiu), mantemos o preview (blob) temporariamente
          const finalImage = removeImage
            ? null
            : ((!updatedImage?.url || updatedImage.url === oldUrl)
              ? (previewUrl ? { url: previewUrl } : (localUser?.image ?? null))
              : updatedImage)
          const nextUser = {
            ...(localUser ?? {}),
            name: values.name,
            image: finalImage,
          }
          localStorage.setItem(`${subdomain}-kayla-user`, JSON.stringify(nextUser))

          // Atualiza estado local
          setMe((prev) => prev ? ({ ...prev, name: values.name, image: (removeImage ? null : (nextUser.image ?? prev.image)) }) : prev)
          // Não sobrescreve o preview com uma URL antiga do backend.
          // Se o backend já retornar a nova URL (não blob:), aplicamos; caso contrário mantemos o preview atual (blob) até a confirmação.
          if (!removeImage && finalImage?.url && !String(finalImage.url).startsWith('blob:')) {
            if (finalImage.url !== previewUrl) {
              setPreviewUrl(finalImage.url)
            }
          }
          if (removeImage) {
            setPreviewUrl(null)
          }

          // Notifica o sidebar/nav para atualizar imediatamente
          try {
            window.dispatchEvent(new CustomEvent('kayla:user-updated', {
              detail: {
                name: values.name,
                email: nextUser?.email ?? undefined,
                avatarUrl: (removeImage ? null : (finalImage?.url ?? previewUrl ?? null)) as string | null,
              }
            }))
          } catch {}

          // Passo opcional: refetch leve para sincronizar a imagem definitiva do backend (evita ficar com blob após upload)
          if (!removeImage) {
            try {
              setTimeout(async () => {
  const check = await privateInstance.get('/api:eA5lqIuH/auth/me')
                const data2 = Array.isArray(check?.data) ? (check?.data[0] ?? null) : check?.data
                const finalUrl: string | undefined = data2?.image?.url
                if (finalUrl && typeof finalUrl === 'string' && !finalUrl.startsWith('blob:')) {
                  // Atualiza localStorage e estado com a URL definitiva
                  const raw2 = localStorage.getItem(`${subdomain}-kayla-user`)
                  let localUser2: any = null
                  try { localUser2 = raw2 ? JSON.parse(raw2) : null } catch { localUser2 = null }
                  const nextUser2 = { ...(localUser2 ?? {}), image: { ...(localUser2?.image ?? {}), url: finalUrl } }
                  localStorage.setItem(`${subdomain}-kayla-user`, JSON.stringify(nextUser2))
                  setMe((prev) => prev ? ({ ...prev, image: nextUser2.image }) : prev)
                  setPreviewUrl(finalUrl)
                  // Notifica o sidebar
                  try {
                    window.dispatchEvent(new CustomEvent('kayla:user-updated', { detail: { avatarUrl: finalUrl, name: nextUser2?.name, email: nextUser2?.email } }))
                  } catch {}
                }
              }, 1500)
            } catch {}
          } else {
            // Se removido, garante que localStorage e preview estejam limpos
            try {
              const raw3 = localStorage.getItem(`${subdomain}-kayla-user`)
              let localUser3: any = null
              try { localUser3 = raw3 ? JSON.parse(raw3) : null } catch { localUser3 = null }
              const nextUser3 = { ...(localUser3 ?? {}), image: null }
              localStorage.setItem(`${subdomain}-kayla-user`, JSON.stringify(nextUser3))
              setPreviewUrl(null)
            } catch {}
          }
        } catch {}
      } else {
        toast.error('Erro ao atualizar seu perfil')
      }
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message ?? 'Erro ao atualizar seu perfil'
      const apiCode = error?.response?.data?.code
      if (apiCode === 'ERROR_CODE_ACCESS_DENIED') {
        toast.error('Não permitido!', {
          description: 'Você não possui permissão para editar este perfil. Contate o administrador.'
        })
      } else {
        toast.error(apiMessage)
      }
    }
  }

  // Pré-visualização e crop
  const VIEWPORT = 300
  const FINAL_SIZE = 512

  const baseSquare = useMemo(() => {
    if (!naturalSize) return null
    const base = Math.min(naturalSize.w, naturalSize.h)
    const baseX0 = Math.floor((naturalSize.w - base) / 2)
    const baseY0 = Math.floor((naturalSize.h - base) / 2)
    return { base, baseX0, baseY0 }
  }, [naturalSize])

  const maxOffset = useMemo(() => {
    if (!baseSquare) return { x: 0, y: 0 }
    const sourceSize = Math.max(32, Math.floor(baseSquare.base / Math.max(1, scale)))
    const max = Math.max(0, baseSquare.base - sourceSize)
    return { x: max, y: max }
  }, [baseSquare, scale])

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  useEffect(() => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas || !naturalSize || !baseSquare) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = VIEWPORT
    canvas.height = VIEWPORT

    const sourceSize = Math.max(32, Math.floor(baseSquare.base / Math.max(1, scale)))
    const sx = baseSquare.baseX0 + clamp(offsetX, 0, maxOffset.x)
    const sy = baseSquare.baseY0 + clamp(offsetY, 0, maxOffset.y)

    ctx.clearRect(0, 0, VIEWPORT, VIEWPORT)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, VIEWPORT, VIEWPORT)

    // Overlay de grade (regra dos terços)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1
    const third = VIEWPORT / 3
    for (let i = 1; i <= 2; i++) {
      // linhas verticais
      ctx.beginPath()
      ctx.moveTo(i * third, 0)
      ctx.lineTo(i * third, VIEWPORT)
      ctx.stroke()
      // linhas horizontais
      ctx.beginPath()
      ctx.moveTo(0, i * third)
      ctx.lineTo(VIEWPORT, i * third)
      ctx.stroke()
    }

    // Borda sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, VIEWPORT - 2, VIEWPORT - 2)
  }, [scale, offsetX, offsetY, naturalSize, baseSquare])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    const file = files && files[0] ? files[0] : undefined
    if (!file) return
    originalFileRef.current = file
    setRemoveImage(false)
    const url = URL.createObjectURL(file)
    // Revoga blob anterior para evitar vazamento
    try { if (lastBlobUrlRef.current && lastBlobUrlRef.current.startsWith('blob:')) URL.revokeObjectURL(lastBlobUrlRef.current) } catch {}
    lastBlobUrlRef.current = url
    setPreviewUrl(url)
    setCropOpen(true)
    setScale(1)
    setOffsetX(0)
    setOffsetY(0)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = url
    // Armazena arquivo original no form (campo 'image')
    form.setValue('image', file as any)
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    setDragging(true)
    lastPointRef.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId)
  }

  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragging || !lastPointRef.current) return
    const dx = e.clientX - lastPointRef.current.x
    const dy = e.clientY - lastPointRef.current.y
    lastPointRef.current = { x: e.clientX, y: e.clientY }
    // Converter movimento do canvas para movimento na fonte
    const sourceSize = Math.max(32, Math.floor((baseSquare?.base ?? 0) / Math.max(1, scale)))
    const ratio = sourceSize / VIEWPORT
    // Inverter direção para que a imagem "acompanhe" o arraste (movimento natural)
    setOffsetX((prev) => clamp(prev - Math.round(dx * ratio), 0, maxOffset.x))
    setOffsetY((prev) => clamp(prev - Math.round(dy * ratio), 0, maxOffset.y))
  }

  function onCanvasPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    setDragging(false)
    lastPointRef.current = null
    try { (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId) } catch {}
  }

  function onCanvasWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const delta = -Math.sign(e.deltaY) * 0.1
    setScale((prev) => clamp(Number((prev + delta).toFixed(2)), 1, 5))
  }

  async function confirmCrop() {
    const img = imageRef.current
    if (!img || !baseSquare) {
      setCropOpen(false)
      return
    }
    const sourceSize = Math.max(32, Math.floor(baseSquare.base / Math.max(1, scale)))
    const sx = baseSquare.baseX0 + clamp(offsetX, 0, maxOffset.x)
    const sy = baseSquare.baseY0 + clamp(offsetY, 0, maxOffset.y)

    const out = document.createElement('canvas')
    out.width = FINAL_SIZE
    out.height = FINAL_SIZE
    const ctx = out.getContext('2d')
    if (!ctx) {
      setCropOpen(false)
      return
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, FINAL_SIZE, FINAL_SIZE)

    return new Promise<void>((resolve) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'] as const
      const preferred = originalFileRef.current?.type ?? 'image/jpeg'
      const outputMime = allowed.includes(preferred as any) ? preferred : 'image/jpeg'
      const ext = outputMime === 'image/png' ? 'png' : outputMime === 'image/webp' ? 'webp' : 'jpg'

      const quality = outputMime === 'image/jpeg' ? 0.92 : (outputMime === 'image/webp' ? 0.9 : undefined)
      out.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `avatar.${ext}`, { type: outputMime })
          form.setValue('image', file as any)
          const nextUrl = URL.createObjectURL(blob)
          try { if (lastBlobUrlRef.current && lastBlobUrlRef.current.startsWith('blob:')) URL.revokeObjectURL(lastBlobUrlRef.current) } catch {}
          lastBlobUrlRef.current = nextUrl
          setPreviewUrl(nextUrl)
          setRemoveImage(false)
          setCropOpen(false)
          resolve()
        } else {
          // Fallback para JPEG se o MIME preferido não for suportado pelo canvas.toBlob
          out.toBlob((blob2) => {
            if (blob2) {
              const file = new File([blob2], 'avatar.jpg', { type: 'image/jpeg' })
              form.setValue('image', file as any)
              const nextUrl = URL.createObjectURL(blob2)
              try { if (lastBlobUrlRef.current && lastBlobUrlRef.current.startsWith('blob:')) URL.revokeObjectURL(lastBlobUrlRef.current) } catch {}
              lastBlobUrlRef.current = nextUrl
              setPreviewUrl(nextUrl)
              setRemoveImage(false)
            }
            setCropOpen(false)
            resolve()
          }, 'image/jpeg', 0.92)
        }
      }, outputMime, quality as any)
    })
  }

  // Handler para integrar o crop do shadcn-io
  async function handleShadcnCrop(croppedDataUrl: string) {
    try {
      // Converte dataURL (PNG) em Blob e File
      const resp = await fetch(croppedDataUrl)
      const blob = await resp.blob()
      const file = new File([blob], 'avatar.png', { type: 'image/png' })
      form.setValue('image', file as any)
      // Atualiza preview
      try { if (lastBlobUrlRef.current && lastBlobUrlRef.current.startsWith('blob:')) URL.revokeObjectURL(lastBlobUrlRef.current) } catch {}
      lastBlobUrlRef.current = null
      setPreviewUrl(croppedDataUrl)
      setRemoveImage(false)
      setCropOpen(false)
    } catch (e) {
      toast.error('Não foi possível aplicar o recorte. Tente novamente.')
    }
  }

  function removeAvatar() {
    // Marca remoção e limpa pré-visualização
    try { if (lastBlobUrlRef.current && lastBlobUrlRef.current.startsWith('blob:')) URL.revokeObjectURL(lastBlobUrlRef.current) } catch {}
    lastBlobUrlRef.current = null
    originalFileRef.current = null
    setPreviewUrl(null)
    setRemoveImage(true)
    form.setValue('image', undefined as any)
  }

  return (
    <div className='flex flex-col w-full h-full'>
      <Topbar title='Meu Perfil' breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Meu Perfil', href: '/dashboard/profile', isLast: true }]} />

      {/* Conteúdo centralizado sem card */}
      <div className='flex-1 overflow-auto p-4'>
        <div className='w-full max-w-xl mx-auto space-y-6 pt-10 md:pt-12'>
          {loadingMe ? (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'><Loader className='w-4 h-4 animate-spin' /> Carregando...</div>
          ) : !me ? (
            <div className='text-sm text-muted-foreground'>Não foi possível carregar seus dados.</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <div className='grid gap-6'>
                  <div className='flex flex-col items-center gap-2'>
                    <button
                      type='button'
                      className='cursor-pointer'
                      onClick={() => fileInputRef.current?.click()}
                      title='Clique para escolher uma imagem'
                      aria-label='Alterar avatar'
                    >
                      <Avatar className='h-24 w-24 rounded-2xl'>
                        <AvatarImage src={previewUrl || undefined} alt={me?.name || ''} />
                        <AvatarFallback className='rounded-2xl'>
                          {getAvatarAbbrev(me?.name || form.getValues('name') || '') || 'AU'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <div>
                      <Button
                        type='button'
                        variant={'outline'}
                        size={'sm'}
                        className='h-8 rounded-full px-3 text-xs gap-1.5 border-muted-foreground/20 text-muted-foreground hover:text-foreground'
                        onClick={removeAvatar}
                        disabled={!previewUrl && !me?.image?.url}
                      >
                        <Trash className='size-3.5' />
                        Remover imagem
                      </Button>
                    </div>
                  </div>

                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <User className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                              <Input placeholder='Seu nome' className='h-12 rounded-xl pl-10' {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email (somente leitura) */}
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Mail className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                          <Input placeholder='Seu email' value={me?.email ?? ''} readOnly disabled className='h-12 rounded-xl pl-10 pr-10' />
                          <Lock className='absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                        </div>
                      </FormControl>
                    </FormItem>

                    {/* Input de arquivo oculto */}
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/jpeg,image/png,image/webp'
                      className='hidden'
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className='flex w-full justify-end items-center gap-2'>
                    <Button type='submit' className='h-11 rounded-xl px-6' disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <Loader className='w-4 h-4 mr-2 animate-spin' />
                      ) : (
                        <Save className='w-4 h-4 mr-2' />
                      )}
                      {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
        </div>
      </div>
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Recortar avatar</DialogTitle>
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
  // Removido getInitials em favor do utilitário compartilhado getAvatarAbbrev
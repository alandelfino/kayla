import { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UploadCloud, Loader } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'

const mediaSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
})

export function NewMediaDialog({ onCreated, onOpenChange }: { onCreated?: () => void, onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const form = useForm<z.infer<typeof mediaSchema>>({
    resolver: zodResolver(mediaSchema),
    defaultValues: { name: '' },
  })

  const submit = async (values: z.infer<typeof mediaSchema>) => {
    try {
      // Validação: imagem obrigatória
      if (!imageFile) {
        toast.error('Imagem é obrigatória')
        return
      }
      setCreating(true)
      const fd = new FormData()
      fd.append('name', values.name)
      fd.append('file', imageFile)
      const res = await privateInstance.post('/api:qSTOvw0A/medias', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.status !== 200 && res.status !== 201) throw new Error('Erro ao criar mídia')
      toast.success('Mídia criada com sucesso!')
      form.reset()
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      setImageFile(null)
      setOpen(false)
      onOpenChange?.(false)
      onCreated?.()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao criar mídia')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); onOpenChange?.(v) }}>
      <DialogTrigger asChild>
        <Button size={'sm'}>
          <UploadCloud /> Nova mídia
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => submit(v))} className='flex flex-col gap-4'>
            <DialogHeader>
              <DialogTitle>Criar mídia</DialogTitle>
              <DialogDescription>Selecione uma imagem e informe o nome.</DialogDescription>
            </DialogHeader>
            {/* Campo de imagem com preview */}
            <div>
              <input id='new-media-image' type='file' accept='image/*' className='hidden' required onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                if (!file) {
                  if (imagePreview) URL.revokeObjectURL(imagePreview)
                  setImagePreview(null)
                  setImageFile(null)
                  return
                }
                const maxSize = 10 * 1024 * 1024
                if (file.size > maxSize) {
                  toast.error('Arquivo muito grande (máx. 10MB)')
                  return
                }
                const preview = URL.createObjectURL(file)
                if (imagePreview) URL.revokeObjectURL(imagePreview)
                setImagePreview(preview)
                setImageFile(file)
              }} />
              <label htmlFor='new-media-image' className='block rounded-md border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden'>
                <div className='aspect-video w-full flex items-center justify-center relative'>
                  {imagePreview ? (
                    <img src={imagePreview} alt='Preview' className='object-cover w-full h-full' />
                  ) : (
                    <div className='flex flex-col items-center justify-center text-muted-foreground'>
                      <UploadCloud className='w-10 h-10' />
                      <span className='text-xs mt-2'>Clique para selecionar uma imagem (obrigatório)</span>
                    </div>
                  )}
                  {imagePreview && (
                    <div className='absolute top-2 right-2 flex items-center gap-2'>
                      <Button type='button' size={'sm'} variant={'secondary'} onClick={(e) => { e.preventDefault(); const input = document.getElementById('new-media-image') as HTMLInputElement | null; input?.click() }}>Trocar</Button>
                      <Button type='button' size={'sm'} variant={'outline'} onClick={(e) => { e.preventDefault(); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); setImageFile(null) }}>Remover</Button>
                    </div>
                  )}
                </div>
              </label>
            </div>
            <FormField control={form.control} name='name' render={({ field }) => (
              <FormItem>
                <FormLabel>Nome<span className='text-destructive'>*</span></FormLabel>
                <FormControl>
                  <Input placeholder='Ex.: Banner da Home' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancelar</Button>
              </DialogClose>
              <Button type='submit' disabled={creating || !imageFile || !(form.watch('name')?.trim())}>{creating ? <Loader className='animate-spin' /> : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
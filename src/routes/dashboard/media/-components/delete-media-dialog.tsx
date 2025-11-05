import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash, Loader } from 'lucide-react'
import { useState } from 'react'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'

type ApiMedia = { id: number, name?: string }

export function DeleteMediaDialog({ media, onDeleted }: { media: ApiMedia, onDeleted?: () => void }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const submit = async () => {
    try {
      setDeleting(true)
      const res = await privateInstance.delete(`/api:qSTOvw0A/medias/${media.id}`)
      if (res.status !== 200 && res.status !== 204) throw new Error('Erro ao excluir mídia')
      toast.success('Mídia excluída!')
      setOpen(false)
      onDeleted?.()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao excluir mídia')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={'icon'} variant={'ghost'}><Trash className='w-4 h-4' /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir mídia</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancelar</Button>
          </DialogClose>
          <Button variant='destructive' onClick={submit} disabled={deleting}>{deleting ? <Loader className='animate-spin' /> : 'Excluir'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
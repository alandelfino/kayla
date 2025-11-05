import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash, Loader } from 'lucide-react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'

export function DerivationItemDeleteDialog({ itemId, onDeleted }: { itemId: number, onDeleted?: () => void }) {
  const [open, setOpen] = useState(false)
  const { isPending: deleting, mutate: deleteItem } = useMutation({
    mutationFn: async () => {
      const response = await privateInstance.delete(`/api:JOs6IYNo/derivation_items/${itemId}`)
      if (response.status !== 200 && response.status !== 204) throw new Error('Erro ao excluir item')
      return response
    },
    onSuccess: () => {
      toast.success('Item excluído com sucesso!')
      setOpen(false)
      onDeleted?.()
    },
    onError: (error: any) => toast.error(error?.message ?? 'Erro ao excluir item')
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={'sm'} variant={'ghost'}><Trash /> Excluir</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir item</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancelar</Button>
          </DialogClose>
          <Button onClick={() => deleteItem()} disabled={deleting}>{deleting ? <Loader className='animate-spin' /> : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
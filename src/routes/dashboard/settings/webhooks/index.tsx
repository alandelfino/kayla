import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/webhooks/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold'>Webhooks</h2>
      <p className='text-sm text-muted-foreground'>Gerencie webhooks para eventos da conta.</p>
    </div>
  )
}
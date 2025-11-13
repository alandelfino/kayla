import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/integrations/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold'>Integrações</h2>
      <p className='text-sm text-muted-foreground'>Conecte serviços externos à sua conta.</p>
    </div>
  )
}
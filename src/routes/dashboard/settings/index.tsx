import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='flex flex-col gap-2 p-2'>
      <span className='text-sm text-muted-foreground'>Selecione uma seção nas configurações.</span>
    </div>
  )
}
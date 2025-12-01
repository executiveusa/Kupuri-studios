import ErrorBoundary from '@/components/common/ErrorBoundary'
import { NotFound } from '@/components/error/NotFound'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFound,
})


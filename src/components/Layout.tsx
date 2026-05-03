import { Link, NavLink, Outlet } from 'react-router'
import { CmdKPalette } from './CmdK/CmdKPalette'
import { ENTITIES } from '../entities'
import Container from './ui/Container'
import KbdHint from './ui/KbdHint'

function Layout() {
  return (
    <div className="min-h-svh flex flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <Link
          to="/"
          className="font-semibold tracking-tight text-ink no-underline hover:text-accent"
        >
          Delta Green Campaign Manager
        </Link>
        <KbdHint>⌘K</KbdHint>
      </header>
      <div className="flex flex-1">
        <nav className="w-56 shrink-0 border-r border-border bg-surface px-3 py-4">
          <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
            {ENTITIES.map((entity) => (
              <li key={entity.key}>
                <NavLink
                  to={entity.path}
                  className={({ isActive }) =>
                    `block rounded-sm px-2 py-1.5 text-sm no-underline transition-colors ${
                      isActive
                        ? 'bg-surface-2 text-accent font-medium'
                        : 'text-ink hover:bg-surface-2 hover:text-accent'
                    }`
                  }
                >
                  {entity.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 border-t border-border pt-2">
              <NavLink
                to="/import"
                className={({ isActive }) =>
                  `block rounded-sm px-2 py-1.5 text-sm no-underline transition-colors ${
                    isActive
                      ? 'bg-surface-2 text-accent font-medium'
                      : 'text-ink hover:bg-surface-2 hover:text-accent'
                  }`
                }
              >
                Import
              </NavLink>
            </li>
          </ul>
        </nav>
        <main className="flex-1 min-w-0">
          <Container>
            <Outlet />
          </Container>
        </main>
      </div>
      <CmdKPalette />
    </div>
  )
}

export default Layout

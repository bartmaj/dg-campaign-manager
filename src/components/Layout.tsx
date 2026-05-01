import { Link, NavLink, Outlet } from 'react-router'
import { CmdKPalette } from './CmdK/CmdKPalette'
import { ENTITIES } from '../entities'

function Layout() {
  return (
    <div className="app-shell">
      <header>
        <Link to="/" className="brand">
          Delta Green Campaign Manager
        </Link>
      </header>
      <nav>
        <ul>
          {ENTITIES.map((entity) => (
            <li key={entity.key}>
              <NavLink to={entity.path}>{entity.label}</NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/import">Import</NavLink>
          </li>
        </ul>
      </nav>
      <main>
        <Outlet />
      </main>
      <CmdKPalette />
    </div>
  )
}

export default Layout

import { NavLink } from 'react-router-dom'

function navClassName({ isActive }) {
  return isActive ? 'route-tab active' : 'route-tab'
}

export function TenantNav() {
  return (
    <nav className="route-tabs" aria-label="Tenant workspace navigation">
      <NavLink to="/app/dashboard" className={navClassName}>
        Dashboard
      </NavLink>
      <NavLink to="/app/stores" className={navClassName}>
        Stores
      </NavLink>
      <NavLink to="/app/shift" className={navClassName}>
        Shift
      </NavLink>
      <NavLink to="/app/staff" className={navClassName}>
        Staff
      </NavLink>
    </nav>
  )
}

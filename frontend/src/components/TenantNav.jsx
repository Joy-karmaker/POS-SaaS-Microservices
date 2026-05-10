import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getTenantProfile } from '../api/staffApi'
import { useAuth } from '../hooks/useAuth'

function navClassName({ isActive }) {
  return isActive ? 'route-tab active' : 'route-tab'
}

export function TenantNav() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const p = await getTenantProfile()
      setProfile(p)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return <nav className="route-tabs"><span className="muted">Loading navigation...</span></nav>
  }

  // Business Logic for visibility:
  // Admin: Dashboard, Stores, Staff, Shift
  // Manager: Store, Staff, Shift
  // Staff: Staff
  // Cashier: Shift

  const roleCode = profile?.role_code || ''
  const isOwner = roleCode === 'admin'
  const isManager = roleCode === 'manager'
  const isStaff = roleCode === 'staff'
  const isCashier = roleCode === 'cashier'

  const showDashboard = isOwner
  const showStores = isOwner || isManager
  const showCatalog = isOwner || isManager
  const showStaff = isOwner || isManager || isStaff
  const showShift = isOwner || isManager || isCashier

  return (
    <nav className="route-tabs" aria-label="Tenant workspace navigation">
      {showDashboard && (
        <NavLink to="/app/dashboard" className={navClassName}>
          Dashboard
        </NavLink>
      )}
      {showStores && (
        <NavLink to="/app/stores" className={navClassName}>
          Stores
        </NavLink>
      )}
      {showCatalog && (
        <NavLink to="/app/catalog" className={navClassName}>
          Catalog
        </NavLink>
      )}
      {showStaff && (
        <NavLink to="/app/staff" className={navClassName}>
          Staff
        </NavLink>
      )}
      {showShift && (
        <NavLink to="/app/shift" className={navClassName}>
          Shift
        </NavLink>
      )}
    </nav>
  )
}

export function getHomePathByRole(role, tenantProfile = null) {
  if (role === 'platform_admin') return '/admin/tenants'
  
  if (tenantProfile) {
    const code = tenantProfile.role_code
    if (code === 'admin') return '/app/dashboard'
    if (code === 'manager') return '/app/stores'
    if (code === 'staff') return '/app/staff'
    if (code === 'cashier') return '/app/shift'
  }

  if (role === 'user') return '/app/shift'
  return '/app/dashboard'
}

export function getLoginPathByRole(role) {
  return role === 'platform_admin' ? '/admin/login' : '/app/login'
}

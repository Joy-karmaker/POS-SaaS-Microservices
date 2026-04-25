export function getHomePathByRole(role) {
  return role === 'platform_admin' ? '/admin/tenants' : '/app/dashboard'
}

export function getLoginPathByRole(role) {
  return role === 'platform_admin' ? '/admin/login' : '/app/login'
}

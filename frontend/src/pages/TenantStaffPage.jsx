import { TenantNav } from '../components/TenantNav'
import { useStaffUsers } from '../hooks/useStaffUsers'
import { useStores } from '../hooks/useStores'

export function TenantStaffPage({ user }) {
  const { stores, isLoadingStores } = useStores({ enabled: true })
  const {
    username,
    setUsername,
    fullName,
    setFullName,
    storeId,
    setStoreId,
    roleId,
    setRoleId,
    password,
    setPassword,
    users,
    roles,
    error,
    isLoadingUsers,
    isLoadingRoles,
    isCreatingUser,
    canCreateUser,
    submitUser,
  } = useStaffUsers({ enabled: true })

  async function handleCreateUser(event) {
    event.preventDefault()
    await submitUser()
  }

  return (
    <main className="content-grid">
      <article className="card span-2">
        <h2>Staff Management</h2>
        <p className="muted">Create and view tenant staff users.</p>
        <TenantNav />
      </article>

      <article className="card">
        <h2>Create Staff User</h2>
        <form className="tenant-form" onSubmit={handleCreateUser}>
          <label htmlFor="staffFullName">Full Name</label>
          <input
            id="staffFullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />

          <label htmlFor="staffUsername">Staff Username</label>
          <input
            id="staffUsername"
            type="text"
            placeholder="e.g. cashier1 or john"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <label htmlFor="staffStore">Store Assignment</label>
          <select
            id="staffStore"
            value={storeId}
            onChange={(event) => setStoreId(event.target.value)}
            disabled={isLoadingStores}
          >
            <option value="">Select a Store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>

          <label htmlFor="staffRole">Staff Role</label>
          <select
            id="staffRole"
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            disabled={isLoadingRoles}
          >
            <option value="">Select a Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <label htmlFor="staffPassword">Password</label>
          <input
            id="staffPassword"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" disabled={!canCreateUser}>
            {isCreatingUser ? 'Creating...' : 'Create Staff User'}
          </button>
        </form>

        {error ? <p className="error-text">{error}</p> : null}
      </article>

      <article className="card">
        <h2>Stats</h2>
        <div className="session-meta">
          <p>
            <strong>Role:</strong> {user?.role ?? 'N/A'}
          </p>
          <p>
            <strong>Total Staff:</strong> {users.length}
          </p>
        </div>
      </article>

      <article className="card span-2">
        <h2>Staff Users</h2>
        {users.length === 0 ? (
          <p className="muted">{isLoadingUsers ? 'Loading users...' : 'No staff users yet.'}</p>
        ) : (
          <div className="tenant-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Store</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((staffUser) => (
                  <tr key={staffUser.id}>
                    <td>{staffUser.full_name}</td>
                    <td>{staffUser.store_name ?? 'N/A'}</td>
                    <td>{staffUser.role_name ?? 'N/A'}</td>
                    <td>{staffUser.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </main>
  )
}

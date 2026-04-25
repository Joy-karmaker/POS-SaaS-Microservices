 import { TenantNav } from '../components/TenantNav'
import { useStaffUsers } from '../hooks/useStaffUsers'

export function TenantStaffPage({ user }) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    users,
    error,
    isLoadingUsers,
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
        <p className="muted">Create and view tenant staff users (cashier/operator role).</p>
        <TenantNav />
      </article>

      <article className="card">
        <h2>Create Staff User</h2>
        <form className="tenant-form" onSubmit={handleCreateUser}>
          <label htmlFor="staffEmail">Email</label>
          <input
            id="staffEmail"
            type="email"
            placeholder="cashier@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

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
        <h2>Current Session</h2>
        <div className="session-meta">
          <p>
            <strong>Tenant ID:</strong> {user?.tenant_id ?? 'N/A'}
          </p>
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
                  <th>Email</th>
                  <th>Role</th>
                  <th>User ID</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((staffUser) => (
                  <tr key={staffUser.id}>
                    <td>{staffUser.email}</td>
                    <td>{staffUser.role}</td>
                    <td>{staffUser.id}</td>
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

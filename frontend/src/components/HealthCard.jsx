export function HealthCard({
  healthItems,
  isCheckingHealth,
  onRefresh,
  title = 'Service Health',
}) {
  return (
    <article className="card">
      <div className="card-head">
        <h2>{title}</h2>
        <button type="button" onClick={onRefresh} disabled={isCheckingHealth}>
          {isCheckingHealth ? 'Checking...' : 'Refresh'}
        </button>
      </div>
      <ul className="status-list">
        {healthItems.map((item) => (
          <li className="status-item" key={item.label}>
            <div className="status-line">
              <span className={`status-dot ${item.status}`} />
              <strong>{item.label}</strong>
            </div>
            <div className="status-meta">
              <span>{item.message}</span>
              <span>{item.latency === null ? '--' : `${item.latency} ms`}</span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}

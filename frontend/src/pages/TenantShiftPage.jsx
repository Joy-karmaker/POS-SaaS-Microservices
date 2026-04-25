import { useEffect } from 'react'
import { TenantNav } from '../components/TenantNav'
import { useShift } from '../hooks/useShift'
import { useStores } from '../hooks/useStores'

export function TenantShiftPage() {
  const { stores, storeError, isLoadingStores } = useStores({ enabled: true })
  const {
    selectedStoreId,
    setSelectedStoreId,
    openingBalance,
    setOpeningBalance,
    closingBalance,
    setClosingBalance,
    currentShift,
    shiftError,
    isLoadingCurrent,
    isOpeningShift,
    isClosingShift,
    canOpenShift,
    canCloseShift,
    openCurrentShift,
    closeCurrentShift,
    refreshCurrentShift,
  } = useShift()

  useEffect(() => {
    if (selectedStoreId.trim() === '' && stores.length > 0) {
      setSelectedStoreId(stores[0].id)
    }
  }, [selectedStoreId, setSelectedStoreId, stores])

  async function handleOpenShift(event) {
    event.preventDefault()
    const opened = await openCurrentShift()
    if (opened) {
      await refreshCurrentShift()
    }
  }

  async function handleCloseShift(event) {
    event.preventDefault()
    const closed = await closeCurrentShift()
    if (closed) {
      await refreshCurrentShift()
    }
  }

  return (
    <main className="content-grid">
      <article className="card span-2">
        <h2>Shift Management</h2>
        <p className="muted">Open and close shifts per store for cashier operations.</p>
        <TenantNav />
      </article>

      <article className="card">
        <h2>Select Store</h2>
        <form className="tenant-form" onSubmit={handleOpenShift}>
          <label htmlFor="shiftStore">Store</label>
          <select
            id="shiftStore"
            value={selectedStoreId}
            onChange={(event) => setSelectedStoreId(event.target.value)}
          >
            <option value="">Select a store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.code})
              </option>
            ))}
          </select>

          <label htmlFor="openingBalance">Opening Balance (Optional)</label>
          <input
            id="openingBalance"
            type="number"
            min="0"
            step="0.01"
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
          />

          <button type="submit" disabled={!canOpenShift}>
            {isOpeningShift ? 'Opening Shift...' : 'Open Shift'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Close Active Shift</h2>
        <form className="tenant-form" onSubmit={handleCloseShift}>
          <label htmlFor="closingBalance">Closing Balance (Optional)</label>
          <input
            id="closingBalance"
            type="number"
            min="0"
            step="0.01"
            value={closingBalance}
            onChange={(event) => setClosingBalance(event.target.value)}
          />

          <button type="submit" disabled={!canCloseShift}>
            {isClosingShift ? 'Closing Shift...' : 'Close Shift'}
          </button>
        </form>
      </article>

      <article className="card span-2">
        <h2>Current Shift</h2>
        {isLoadingStores ? <p className="muted">Loading stores...</p> : null}
        {!isLoadingStores && stores.length === 0 ? (
          <p className="muted">No stores found. Create a store first from the Stores page.</p>
        ) : null}
        {!isLoadingStores && stores.length > 0 && selectedStoreId.trim() === '' ? (
          <p className="muted">Select a store to enable shift actions.</p>
        ) : null}
        {storeError ? <p className="error-text">{storeError}</p> : null}
        {isLoadingCurrent ? <p className="muted">Checking current shift...</p> : null}
        {shiftError ? <p className="error-text">{shiftError}</p> : null}

        {currentShift ? (
          <div className="session-meta">
            <p>
              <strong>Shift ID:</strong> {currentShift.id}
            </p>
            <p>
              <strong>Store ID:</strong> {currentShift.store_id}
            </p>
            <p>
              <strong>Status:</strong> {currentShift.status}
            </p>
            <p>
              <strong>Opened At:</strong> {currentShift.opened_at}
            </p>
            <p>
              <strong>Opening Balance:</strong> {currentShift.opening_balance}
            </p>
            <p>
              <strong>Closing Balance:</strong> {currentShift.closing_balance ?? 'N/A'}
            </p>
          </div>
        ) : (
          <p className="muted">No active shift for selected store.</p>
        )}
      </article>
    </main>
  )
}

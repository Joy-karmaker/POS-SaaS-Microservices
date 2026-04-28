import { useCallback, useEffect, useMemo, useState } from 'react'
import { closeShift, getCurrentShift, openShift } from '../api/shiftApi'
import { getErrorMessage } from '../api/httpUtils'

function isNoActiveShiftError(message) {
  return message.toLowerCase().includes('no active shift')
}

export function useShift() {
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [closingBalance, setClosingBalance] = useState('')
  const [currentShift, setCurrentShift] = useState(null)
  const [shiftError, setShiftError] = useState('')
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false)
  const [isOpeningShift, setIsOpeningShift] = useState(false)
  const [isClosingShift, setIsClosingShift] = useState(false)

  const refreshCurrentShift = useCallback(async (storeId = selectedStoreId) => {
    const normalizedStoreId = String(storeId ?? '').trim()
    if (normalizedStoreId === '') {
      setCurrentShift(null)
      setShiftError('')
      return null
    }

    setIsLoadingCurrent(true)
    setShiftError('')

    try {
      const shift = await getCurrentShift(normalizedStoreId)
      setCurrentShift(shift)
      return shift
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load current shift')
      if (isNoActiveShiftError(message)) {
        setCurrentShift(null)
        setShiftError('')
        return null
      }

      setShiftError(message)
      setCurrentShift(null)
      return null
    } finally {
      setIsLoadingCurrent(false)
    }
  }, [selectedStoreId])

  useEffect(() => {
    refreshCurrentShift()
  }, [refreshCurrentShift, selectedStoreId])

  const hasStoreSelected = useMemo(() => {
    const idStr = String(selectedStoreId ?? '').trim()
    return idStr !== '' && idStr !== '0'
  }, [selectedStoreId])

  const canOpenShift = useMemo(() => {
    return hasStoreSelected && !isOpeningShift && currentShift === null
  }, [currentShift, isOpeningShift, hasStoreSelected])

  const canCloseShift = useMemo(() => {
    return hasStoreSelected && !isClosingShift && currentShift !== null
  }, [currentShift, isClosingShift, hasStoreSelected])

  const openCurrentShift = useCallback(async () => {
    if (!canOpenShift) {
      return null
    }

    setIsOpeningShift(true)
    setShiftError('')

    try {
      const shift = await openShift({
        storeId: selectedStoreId,
        openingBalance,
      })

      setCurrentShift(shift)
      setClosingBalance('')
      return shift
    } catch (error) {
      setShiftError(getErrorMessage(error, 'Failed to open shift'))
      return null
    } finally {
      setIsOpeningShift(false)
    }
  }, [canOpenShift, openingBalance, selectedStoreId])

  const closeCurrentShift = useCallback(async () => {
    if (!canCloseShift) {
      return null
    }

    setIsClosingShift(true)
    setShiftError('')

    try {
      const shift = await closeShift({
        storeId: selectedStoreId,
        closingBalance,
      })

      setCurrentShift(shift)
      return shift
    } catch (error) {
      setShiftError(getErrorMessage(error, 'Failed to close shift'))
      return null
    } finally {
      setIsClosingShift(false)
    }
  }, [canCloseShift, closingBalance, selectedStoreId])

  return {
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
    refreshCurrentShift,
    openCurrentShift,
    closeCurrentShift,
  }
}

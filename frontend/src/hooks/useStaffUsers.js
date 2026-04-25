import { useCallback, useEffect, useMemo, useState } from 'react'
import { createStaffUser, getStaffUsers } from '../api/staffApi'
import { getErrorMessage } from '../api/httpUtils'

export function useStaffUsers({ enabled = true } = {}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const refreshUsers = useCallback(async () => {
    if (!enabled) {
      setUsers([])
      return []
    }

    setIsLoadingUsers(true)
    setError('')

    try {
      const rows = await getStaffUsers()
      setUsers(rows)
      return rows
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to load staff users'))
      setUsers([])
      return []
    } finally {
      setIsLoadingUsers(false)
    }
  }, [enabled])

  useEffect(() => {
    refreshUsers()
  }, [refreshUsers])

  const canCreateUser = useMemo(() => {
    return (
      enabled &&
      email.trim().length >= 5 &&
      password.trim().length >= 8 &&
      !isCreatingUser
    )
  }, [email, enabled, isCreatingUser, password])

  const submitUser = useCallback(async () => {
    if (!canCreateUser) {
      return null
    }

    setIsCreatingUser(true)
    setError('')

    try {
      const created = await createStaffUser({
        email: email.trim(),
        password: password.trim(),
        role: 'user',
      })

      if (!created) {
        throw new Error('Staff user creation returned empty response')
      }

      setUsers((current) => [created, ...current])
      setEmail('')
      setPassword('')
      return created
    } catch (createError) {
      setError(getErrorMessage(createError, 'Staff user creation failed'))
      return null
    } finally {
      setIsCreatingUser(false)
    }
  }, [canCreateUser, email, password])

  return {
    email,
    setEmail,
    password,
    setPassword,
    users,
    error,
    isLoadingUsers,
    isCreatingUser,
    canCreateUser,
    refreshUsers,
    submitUser,
  }
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createStaffUser, getStaffUsers, getStaffRoles } from '../api/staffApi'
import { getErrorMessage } from '../api/httpUtils'

export function useStaffUsers({ enabled = true } = {}) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [storeId, setStoreId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [password, setPassword] = useState('')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
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

  const refreshRoles = useCallback(async () => {
    if (!enabled) {
      setRoles([])
      return []
    }

    setIsLoadingRoles(true)

    try {
      const rows = await getStaffRoles()
      setRoles(rows)
      return rows
    } catch (loadError) {
      console.error('Failed to load roles:', loadError)
      setRoles([])
      return []
    } finally {
      setIsLoadingRoles(false)
    }
  }, [enabled])

  useEffect(() => {
    refreshUsers()
    refreshRoles()
  }, [refreshUsers, refreshRoles])

  const canCreateUser = useMemo(() => {
    return (
      enabled &&
      username.trim().length >= 2 &&
      fullName.trim().length >= 2 &&
      storeId !== '' &&
      roleId !== '' &&
      password.trim().length >= 8 &&
      !isCreatingUser
    )
  }, [username, fullName, storeId, roleId, enabled, isCreatingUser, password])

  const submitUser = useCallback(async () => {
    if (!canCreateUser) {
      return null
    }

    setIsCreatingUser(true)
    setError('')

    try {
      const created = await createStaffUser({
        username: username.trim(),
        full_name: fullName.trim(),
        store_id: storeId,
        role_id: roleId,
        password: password.trim(),
      })

      if (!created) {
        throw new Error('Staff user creation returned empty response')
      }

      setUsers((current) => [created, ...current])
      setUsername('')
      setFullName('')
      setStoreId('')
      setRoleId('')
      setPassword('')
      return created
    } catch (createError) {
      setError(getErrorMessage(createError, 'Staff user creation failed'))
      return null
    } finally {
      setIsCreatingUser(false)
    }
  }, [canCreateUser, username, fullName, storeId, roleId, password])

  return {
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
    refreshUsers,
    submitUser,
  }
}

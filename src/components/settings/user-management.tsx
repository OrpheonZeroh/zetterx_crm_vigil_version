'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Users, UserCheck, UserX } from 'lucide-react'
import { AuthService, type UserProfile, type UserRole } from '@/lib/services/auth-service'
import { useToast } from '@/components/ui/toast'
import { StatusBadge, LoadingSpinner } from '@/components/common'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { UserModal } from './user-modal'

interface UserManagementProps {
  onRefresh?: () => void
}

export function UserManagement({ onRefresh }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [userModal, setUserModal] = useState<{
    isOpen: boolean
    user: UserProfile | null
  }>({ isOpen: false, user: null })
  
  const [toggleModal, setToggleModal] = useState<{
    isOpen: boolean
    user: UserProfile | null
    loading: boolean
  }>({ isOpen: false, user: null, loading: false })

  const { showToast } = useToast()

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await AuthService.getUsers()
      setUsers(usersData)
    } catch (error: any) {
      console.error('Error loading users:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar usuarios'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = () => {
    setUserModal({ isOpen: true, user: null })
  }

  const handleEditUser = (user: UserProfile) => {
    setUserModal({ isOpen: true, user })
  }

  const handleUserSaved = () => {
    loadUsers()
    onRefresh?.()
    showToast({
      type: 'success',
      title: 'Usuario guardado',
      message: 'El usuario ha sido guardado exitosamente'
    })
  }

  const handleToggleStatus = (user: UserProfile) => {
    setToggleModal({ isOpen: true, user, loading: false })
  }

  const confirmToggleStatus = async () => {
    if (!toggleModal.user) return
    
    setToggleModal(prev => ({ ...prev, loading: true }))
    
    try {
      const result = await AuthService.toggleUserStatus(toggleModal.user.id)
      if (result.success) {
        await loadUsers()
        showToast({
          type: 'success',
          title: 'Estado actualizado',
          message: `Usuario ${toggleModal.user.is_active ? 'desactivado' : 'activado'} exitosamente`
        })
        setToggleModal({ isOpen: false, user: null, loading: false })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al cambiar estado del usuario'
      })
    } finally {
      setToggleModal(prev => ({ ...prev, loading: false }))
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'administrativo':
        return 'bg-blue-100 text-blue-800'
      case 'instalador':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'administrativo':
        return 'Administrativo'
      case 'instalador':
        return 'Instalador'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión de Usuarios
          </h2>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.is_active ? (
                        <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className={`text-sm ${user.is_active ? 'text-green-800' : 'text-red-800'}`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es-PA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay usuarios
            </h3>
            <p className="text-gray-500 mb-4">
              Comienza creando tu primer usuario
            </p>
            <Button onClick={handleCreateUser}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </div>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={userModal.isOpen}
        onClose={() => setUserModal({ isOpen: false, user: null })}
        user={userModal.user}
        onSave={handleUserSaved}
      />

      {/* Toggle Status Confirmation Modal */}
      <ConfirmationModal
        isOpen={toggleModal.isOpen}
        onClose={() => setToggleModal({ isOpen: false, user: null, loading: false })}
        onConfirm={confirmToggleStatus}
        title={`${toggleModal.user?.is_active ? 'Desactivar' : 'Activar'} Usuario`}
        message={`¿Estás seguro de que deseas ${toggleModal.user?.is_active ? 'desactivar' : 'activar'} al usuario "${toggleModal.user?.full_name}"?`}
        type={toggleModal.user?.is_active ? 'danger' : 'info'}
        loading={toggleModal.loading}
      />
    </div>
  )
}

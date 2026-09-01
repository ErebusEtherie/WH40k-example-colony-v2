import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/apiClient'
import type { ColonyCreate, ColonyUpdate } from '../types'
import { useAuth } from './useAuth'

/**
 * Fetch all colonies with pagination
 * Only fetches when user is authenticated
 */
export function useColonies(offset = 0, limit = 20) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: ['colonies', offset, limit],
    queryFn: () => apiClient.getColonies(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated, // Only fetch when authenticated
  })
}

/**
 * Fetch a single colony by ID
 */
export function useColony(colonyId: number) {
  return useQuery({
    queryKey: ['colony', colonyId],
    queryFn: () => apiClient.getColony(colonyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!colonyId,
  })
}

/**
 * Create a new colony
 */
export function useCreateColony() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ColonyCreate) => apiClient.createColony(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colonies'] })
    },
  })
}

/**
 * Update an existing colony
 * Note: ID is passed in mutationFn since we update different colonies dynamically
 */
export function useUpdateColony() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ colonyId, data }: { colonyId: number, data: ColonyUpdate }) => apiClient.updateColony(colonyId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['colony', variables.colonyId] })
      queryClient.invalidateQueries({ queryKey: ['colonies'] })
    },
  })
}

/**
 * Delete a colony
 */
export function useDeleteColony() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (colonyId: number) => apiClient.deleteColony(colonyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colonies'] })
    },
  })
}

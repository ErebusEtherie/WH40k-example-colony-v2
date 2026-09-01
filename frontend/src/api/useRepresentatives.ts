import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/apiClient'
import type { Representative, RepresentativeCreate } from '../types'
import { useAuth } from './useAuth'

/**
 * Fetch all representatives
 * Only fetches when user is authenticated
 */
export function useRepresentatives() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: ['representatives'],
    queryFn: () => apiClient.getRepresentatives(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated, // Only fetch when authenticated
  })
}

/**
 * Create a new representative
 */
export function useCreateRepresentative() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: RepresentativeCreate) => apiClient.createRepresentative(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] })
    },
  })
}

/**
 * Update a representative
 * Note: ID is passed in mutationFn since we update different representatives dynamically
 */
export function useUpdateRepresentative() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ representativeId, data }: { representativeId: number, data: Partial<Representative> }) => 
      apiClient.updateRepresentative(representativeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] })
      queryClient.invalidateQueries({ queryKey: ['colonies'] })
    },
  })
}

/**
 * Delete a representative
 */
export function useDeleteRepresentative() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (representativeId: number) => apiClient.deleteRepresentative(representativeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] })
    },
  })
}

/**
 * Assign a representative to a colony (or unassign)
 * Uses atomic backend endpoints to avoid race conditions
 */
export function useAssignRepresentative() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ colonyId, representativeId }: { colonyId: number, representativeId: number | null }) => {
      if (representativeId !== null) {
        // Use new atomic assign endpoint
        return await apiClient.assignRepresentativeToColony(colonyId, representativeId)
      } else {
        // Use new atomic unassign endpoint
        return await apiClient.unassignRepresentativeFromColony(colonyId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] })
      queryClient.invalidateQueries({ queryKey: ['colonies'] })
    },
  })
}

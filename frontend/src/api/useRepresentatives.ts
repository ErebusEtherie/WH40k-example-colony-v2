import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/apiClient'
import type { Representative, RepresentativeCreate } from '../types'

/**
 * Fetch all representatives
 */
export function useRepresentatives() {
  return useQuery({
    queryKey: ['representatives'],
    queryFn: () => apiClient.getRepresentatives(),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
 * This updates both the colony's representativeId and the representative's assignedColonyId
 */
export function useAssignRepresentative() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ colonyId, representativeId }: { colonyId: number, representativeId: number | null }) => {
      // Update colony's representativeId (convert number to string)
      await apiClient.updateColony(colonyId, { representativeId: representativeId === null ? undefined : String(representativeId) })
      
      // Update representative's assignedColonyId (convert number to string)
      if (representativeId !== null) {
        await apiClient.updateRepresentative(representativeId, { assignedColonyId: String(colonyId) })
      } else {
        // Find and unassign the representative that was previously assigned to this colony
        const reps = await apiClient.getRepresentatives()
        const repToUnassign = reps.find(r => r.assignedColonyId === String(colonyId))
        if (repToUnassign) {
          await apiClient.updateRepresentative(repToUnassign.id, { assignedColonyId: null })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] })
      queryClient.invalidateQueries({ queryKey: ['colonies'] })
    },
  })
}

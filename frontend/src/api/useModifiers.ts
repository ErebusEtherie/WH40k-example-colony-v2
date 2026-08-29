import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/apiClient'
import type { Modifier, ModifierCreate } from '../types'

/**
 * Fetch all modifiers for a colony
 */
export function useModifiers(colonyId: number) {
  return useQuery({
    queryKey: ['colony', colonyId, 'modifiers'],
    queryFn: () => apiClient.getModifiers(colonyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!colonyId,
  })
}

/**
 * Add a custom modifier to a colony
 */
export function useCreateModifier(colonyId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ModifierCreate) => apiClient.addModifier(colonyId, {
      source: data.source || 'custom',
      category: data.category || 'custom',
      stat: data.stat,
      value: data.value,
      name: data.name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId, 'modifiers'] })
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId] })
    },
  })
}

/**
 * Delete a modifier
 */
export function useDeleteModifier(colonyId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (modifierId: number) => apiClient.deleteModifier(colonyId, modifierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId, 'modifiers'] })
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId] })
    },
  })
}

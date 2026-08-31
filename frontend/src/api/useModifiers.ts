import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../utils/apiClient'
import type { ModifierCreate, EventCreate, EventUpdate } from '../types'

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
    mutationFn: (data: ModifierCreate) => {
      // Validation: required fields
      if (!data.stat) {
        throw new Error('Stat is required')
      }
      if (data.value === undefined || data.value === null) {
        throw new Error('Value is required')
      }
      if (!data.name) {
        throw new Error('Description/name is required')
      }
      
      return apiClient.addModifier(colonyId, {
        source: data.source || 'custom',
        category: data.category || 'custom',
        stat: data.stat,
        value: data.value,
        name: data.name,
      })
    },
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

// ==================== EVENTS HOOKS ====================

/**
 * Fetch all events for a colony
 */
export function useEvents(colonyId: number) {
  return useQuery({
    queryKey: ['colony', colonyId, 'events'],
    queryFn: () => apiClient.getEvents(colonyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!colonyId,
  })
}

/**
 * Create a new event
 */
export function useCreateEvent(colonyId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: EventCreate) => apiClient.createEvent(colonyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId, 'events'] })
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId] })
    },
  })
}

/**
 * Update an event
 */
export function useUpdateEvent(colonyId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: EventUpdate }) => 
      apiClient.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId, 'events'] })
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId] })
    },
  })
}

/**
 * Delete an event
 */
export function useDeleteEvent(colonyId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (eventId: number) => apiClient.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId, 'events'] })
      queryClient.invalidateQueries({ queryKey: ['colony', colonyId] })
    },
  })
}

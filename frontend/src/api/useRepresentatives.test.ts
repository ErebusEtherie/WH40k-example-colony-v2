import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHookWithProviders } from '../test/utils'
import { useRepresentatives, useCreateRepresentative, useUpdateRepresentative, useDeleteRepresentative, useAssignRepresentative } from './useRepresentatives'
import { waitFor } from '@testing-library/react'
import { apiClient } from '../utils/apiClient'
import type { Representative } from '../types'

vi.mock('../utils/apiClient', () => ({
  apiClient: {
    getRepresentatives: vi.fn(),
    createRepresentative: vi.fn(),
    updateRepresentative: vi.fn(),
    deleteRepresentative: vi.fn(),
    updateColony: vi.fn(),
    assignRepresentativeToColony: vi.fn(),
    unassignRepresentativeFromColony: vi.fn(),
  },
}))

const mockRepresentatives: Representative[] = [
  { id: '1', name: 'Inquisitor Malchus', type: 'dynasty_member', assignedColonyId: '1', personalities: [{ personalityKey: 'judicious' }], characteristics: { ws: 3, bs: 4, s: 3, t: 4, ag: 3, int: 5, per: 4, wp: 5, fel: 3 }, skills: ['Awareness'], talents: ['Air of Authority'] },
  { id: '2', name: 'Magos Quintus', type: 'colonist_representative', assignedColonyId: null, personalities: [{ personalityKey: 'administrative_expert' }], characteristics: { ws: 2, bs: 3, s: 3, t: 3, ag: 3, int: 5, per: 3, wp: 4, fel: 3 }, skills: ['Administration'], talents: [] },
]

describe('useRepresentatives', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches representatives list successfully', async () => {
    vi.mocked(apiClient.getRepresentatives).mockResolvedValue(mockRepresentatives)
    const { result } = renderHookWithProviders(() => useRepresentatives())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toHaveLength(2)
    expect(apiClient.getRepresentatives).toHaveBeenCalled()
  })

  it('handles errors', async () => {
    vi.mocked(apiClient.getRepresentatives).mockRejectedValue(new Error('Failed to fetch'))
    const { result } = renderHookWithProviders(() => useRepresentatives())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isError).toBe(true)
  })
})

describe('useCreateRepresentative', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('creates a representative', async () => {
    vi.mocked(apiClient.createRepresentative).mockResolvedValue({ id: '123', name: 'New Representative', type: 'colonist_representative', assignedColonyId: null, personalities: [], characteristics: { ws: 3, bs: 3, s: 3, t: 3, ag: 3, int: 3, per: 3, wp: 3, fel: 3 }, skills: [], talents: [] })
    const { result } = renderHookWithProviders(() => useCreateRepresentative())
    result.current.mutate({ name: 'New Representative', type: 'colonist_representative', personalities: [{ personalityKey: 'ambitious' }], characteristics: { ws: 3, bs: 3, s: 3, t: 3, ag: 3, int: 3, per: 3, wp: 3, fel: 3 } })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data?.id).toBe('123')
  })
})

describe('useUpdateRepresentative', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('updates a representative', async () => {
    vi.mocked(apiClient.updateRepresentative).mockResolvedValue({ id: '1', name: 'Updated Name', type: 'dynasty_member', assignedColonyId: '1', personalities: [{ personalityKey: 'judicious' }], characteristics: { ws: 3, bs: 4, s: 3, t: 4, ag: 3, int: 5, per: 4, wp: 5, fel: 3 }, skills: ['Awareness'], talents: ['Air of Authority'] })
    const { result } = renderHookWithProviders(() => useUpdateRepresentative())
    result.current.mutate({ representativeId: 1, data: { name: 'Updated Name' } })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
    expect(apiClient.updateRepresentative).toHaveBeenCalledWith(1, { name: 'Updated Name' })
  })
})

describe('useDeleteRepresentative', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('deletes a representative', async () => {
    vi.mocked(apiClient.deleteRepresentative).mockResolvedValue(undefined)
    const { result } = renderHookWithProviders(() => useDeleteRepresentative())
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
    expect(apiClient.deleteRepresentative).toHaveBeenCalledWith(1)
  })
})

describe('useAssignRepresentative', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('assigns a representative to a colony', async () => {
    vi.mocked(apiClient.assignRepresentativeToColony).mockResolvedValue({ id: '1', assigned_to_colony_id: '1' })
    const { result } = renderHookWithProviders(() => useAssignRepresentative())
    result.current.mutate({ colonyId: 1, representativeId: 1 })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
    expect(apiClient.assignRepresentativeToColony).toHaveBeenCalledWith(1, 1)
  })

  it('unassigns a representative from a colony', async () => {
    vi.mocked(apiClient.unassignRepresentativeFromColony).mockResolvedValue({ id: '1', assigned_to_colony_id: null })
    const { result } = renderHookWithProviders(() => useAssignRepresentative())
    result.current.mutate({ colonyId: 1, representativeId: null })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
    expect(apiClient.unassignRepresentativeFromColony).toHaveBeenCalledWith(1)
  })
})






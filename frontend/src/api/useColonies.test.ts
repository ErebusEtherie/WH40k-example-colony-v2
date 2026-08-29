import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHookWithProviders } from '../test/utils'
import { useColonies, useColony, useCreateColony, useUpdateColony, useDeleteColony } from './useColonies'
import { waitFor } from '@testing-library/react'
import { apiClient } from '../utils/apiClient'

// Mock apiClient
vi.mock('../utils/apiClient', () => ({
  apiClient: {
    getColonies: vi.fn(),
    getColony: vi.fn(),
    createColony: vi.fn(),
    updateColony: vi.fn(),
    deleteColony: vi.fn(),
  },
}))

const mockColoniesList = [
  { id: 1, name: 'Hive Tarsus' },
  { id: 2, name: 'Forge World Alpha' },
]

const mockColony = {
  id: 1,
  name: 'Hive Tarsus',
  order: 4,
}

describe('useColonies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches colonies list successfully', async () => {
    vi.mocked(apiClient.getColonies).mockResolvedValue(mockColoniesList)
    
    const { result } = renderHookWithProviders(() => useColonies())
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toHaveLength(2)
    expect(apiClient.getColonies).toHaveBeenCalled()
  })
})

describe('useColony', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches single colony successfully', async () => {
    vi.mocked(apiClient.getColony).mockResolvedValue(mockColony)
    
    const { result } = renderHookWithProviders(() => useColony(1))
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data?.id).toBe(1)
    expect(apiClient.getColony).toHaveBeenCalledWith(1)
  })

  it('handles errors', async () => {
    vi.mocked(apiClient.getColony).mockRejectedValue(new Error('Not found'))
    
    const { result } = renderHookWithProviders(() => useColony(999))
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    expect(result.current.isError).toBe(true)
  })

  it('does not fetch when colonyId is 0', () => {
    const { result } = renderHookWithProviders(() => useColony(0))
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(apiClient.getColony).not.toHaveBeenCalled()
  })
})

describe('useCreateColony', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a colony', async () => {
    vi.mocked(apiClient.createColony).mockResolvedValue({ id: 123, name: 'New Colony' })
    
    const { result } = renderHookWithProviders(() => useCreateColony())
    
    result.current.mutate({
      name: 'New Colony',
      colonyType: 'mining_and_industry',
      founder: 'Test Founder',
    })
    
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data?.id).toBe(123)
  })
})

describe('useUpdateColony', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates a colony', async () => {
    vi.mocked(apiClient.updateColony).mockResolvedValue({ id: 1, name: 'Updated' })
    
    const { result } = renderHookWithProviders(() => useUpdateColony())
    
    result.current.mutate({ colonyId: 1, data: { name: 'Updated' } })
    
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(apiClient.updateColony).toHaveBeenCalledWith(1, { name: 'Updated' })
  })
})

describe('useDeleteColony', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a colony', async () => {
    vi.mocked(apiClient.deleteColony).mockResolvedValue(undefined)
    
    const { result } = renderHookWithProviders(() => useDeleteColony())
    
    result.current.mutate(1)
    
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(apiClient.deleteColony).toHaveBeenCalledWith(1)
  })
})

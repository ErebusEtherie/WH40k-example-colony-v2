import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHookWithProviders } from '../test/utils'
import { useModifiers, useCreateModifier, useDeleteModifier } from './useModifiers'
import { waitFor } from '@testing-library/react'
import { apiClient } from '../utils/apiClient'

// Mock apiClient
vi.mock('../utils/apiClient', () => ({
  apiClient: {
    getModifiers: vi.fn(),
    addModifier: vi.fn(),
    deleteModifier: vi.fn(),
  },
}))

const mockModifiers = [
  { id: '1', source: 'infrastructure', category: 'permanent' as const, stat: 'productivity' as const, value: 2, name: 'Power Network' },
]

describe('useModifiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches modifiers for a colony', async () => {
    vi.mocked(apiClient.getModifiers).mockResolvedValue(mockModifiers)
    
    const { result } = renderHookWithProviders(() => useModifiers(1))
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toHaveLength(1)
    expect(apiClient.getModifiers).toHaveBeenCalledWith(1)
  })

  it('does not fetch when colonyId is 0', () => {
    const { result } = renderHookWithProviders(() => useModifiers(0))
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(apiClient.getModifiers).not.toHaveBeenCalled()
  })
})

describe('useCreateModifier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a modifier', async () => {
    vi.mocked(apiClient.addModifier).mockResolvedValue({ id: '1', stat: 'order', value: -2 })
    
    const { result } = renderHookWithProviders(() => useCreateModifier(1))
    
    result.current.mutate({
      source: 'custom',
      stat: 'order',
      value: -2,
      name: 'GM Event',
    })
    
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toBeDefined()
  })
})

describe('useDeleteModifier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a modifier', async () => {
    vi.mocked(apiClient.deleteModifier).mockResolvedValue(undefined)
    
    const { result } = renderHookWithProviders(() => useDeleteModifier(1))
    
    result.current.mutate(1)
    
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(apiClient.deleteModifier).toHaveBeenCalledWith(1, 1)
  })
})

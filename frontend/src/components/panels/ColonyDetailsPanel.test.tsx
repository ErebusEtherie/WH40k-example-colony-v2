import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColonyDetailsPanel } from './ColonyDetailsPanel'
import type { Colony, ColonyCalculations, Representative } from '../../types'
import { renderWithProviders } from '../../test/utils'

const mockColony: Colony = {
  id: '1',
  name: 'Hive Tarsus',
  colonyType: 'mining_and_industry',
  founder: 'Lord Commander Tarsus',
  starSystem: 'Calixis Sector',
  description: 'A bustling hive world',
  ageDays: 360,
  representativeId: '1',
  planetaryResources: [
    {
      id: 'res1',
      name: 'Iron Ore',
      type: 'Mineral Resources',
      subtype: 'Metallic',
      abundance: 'Plentiful',
      notes: 'High quality deposits',
    },
  ],
  hardInfrastructure: [],
  supportUpgrades: [],
  developmentPlans: [],
  customModifiers: [
    {
      id: 'mod1',
      source: 'custom',
      category: 'custom',
      stat: 'order',
      value: -1,
      name: 'GM Event',
      notes: 'Temporary penalty',
    },
  ],
}

const mockCalculations: ColonyCalculations = {
  size: {
    stat: 'size',
    baseValue: 5,
    modifiers: [],
    total: 5,
    finalValue: 5,
    loreState: 'freehold',
    loreLabel: 'Freehold (5)',
    isCrisis: false,
    isPositive: false,
  },
  sizeLoreLabel: 'Freehold (5)',
  complacency: {
    stat: 'complacency',
    baseValue: 2,
    modifiers: [],
    total: 2,
    finalValue: 2,
    loreState: 'normal',
    loreLabel: 'Normal',
    isCrisis: false,
    isPositive: false,
  },
  order: {
    stat: 'order',
    baseValue: 4,
    modifiers: [],
    total: 4,
    finalValue: 4,
    loreState: 'stable',
    loreLabel: 'Stable',
    isCrisis: false,
    isPositive: false,
  },
  productivity: {
    stat: 'productivity',
    baseValue: 3,
    modifiers: [
      {
        id: 'mod-infra-1',
        source: 'infrastructure',
        category: 'permanent',
        stat: 'productivity',
        value: 2,
        name: 'Power Network',
      },
    ],
    total: 5,
    finalValue: 5,
    loreState: 'productive',
    loreLabel: 'Productive',
    isCrisis: false,
    isPositive: true,
  },
  piety: {
    stat: 'piety',
    baseValue: 2,
    modifiers: [],
    total: 2,
    finalValue: 2,
    loreState: 'normal',
    loreLabel: 'Normal',
    isCrisis: false,
    isPositive: false,
  },
  profitFactor: {
    baseFromSize: 2,
    stateBonuses: [],
    modifiers: mockColony.customModifiers,
    total: 2,
  },
  activeStateBadges: [],
}

const mockRepresentative: Representative = {
  id: '1',
  name: 'Inquisitor Malchus',
  type: 'military_commander',
  personalities: [
    { personalityKey: 'judicious' },
    { personalityKey: 'ruthless' },
  ],
  characteristics: {
    ws: 3,
    bs: 4,
    s: 3,
    t: 4,
    ag: 3,
    int: 5,
    per: 4,
    wp: 5,
    fel: 3,
  },
  skills: [],
  talents: [],
}

const defaultProps = {
  colony: mockColony,
  calculations: mockCalculations,
  representative: mockRepresentative,
  onUpdateColony: vi.fn(),
  onOpenAddCustomModifier: vi.fn(),
  onOpenChangeRepresentative: vi.fn(),
  onNavigateToRepresentative: vi.fn(),
  onNavigateToInfrastructure: vi.fn(),
  colonyId: 1,
}

describe('ColonyDetailsPanel', () => {
  it('renders colony name and basic information', () => {
    renderWithProviders(<ColonyDetailsPanel {...defaultProps} />)
    
    expect(screen.getByText('Hive Tarsus')).toBeInTheDocument()
    expect(screen.getByText('Lord Commander Tarsus')).toBeInTheDocument()
    expect(screen.getByText('Calixis Sector')).toBeInTheDocument()
  })

  it('renders colony stats correctly', () => {
    renderWithProviders(<ColonyDetailsPanel {...defaultProps} />)
    
    expect(screen.getByText('Order')).toBeInTheDocument()
    expect(screen.getByText('Complacency')).toBeInTheDocument()
    expect(screen.getByText('Productivity')).toBeInTheDocument()
    expect(screen.getByText('Piety')).toBeInTheDocument()
  })

  it('renders representative information when present', () => {
    renderWithProviders(<ColonyDetailsPanel {...defaultProps} />)
    
    expect(screen.getByText('Inquisitor Malchus')).toBeInTheDocument()
    expect(screen.getByText(/military commander/i)).toBeInTheDocument()
  })

  it.skip('calls onOpenAddCustomModifier when add modifier button is clicked', async () => {
    // TODO: Fix test - EventsPanel fetches events via API hook, requires MSW handler
    // The button click triggers an API call that isn't mocked, causing EventCard to crash
    const onOpenAddCustomModifier = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<ColonyDetailsPanel {...defaultProps} onOpenAddCustomModifier={onOpenAddCustomModifier} />)
    
    const addModifierButton = screen.getByRole('button', { name: /add custom modifier/i })
    await user.click(addModifierButton)

    expect(onOpenAddCustomModifier).toHaveBeenCalledTimes(1)
  })
})
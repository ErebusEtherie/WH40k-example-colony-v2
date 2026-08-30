import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InfrastructurePanelGroup } from './InfrastructurePanelGroup'
import type { Colony, ColonyCalculations } from '../../types'
import { renderWithProviders } from '../../test/utils'

const mockColony: Colony = {
  id: '1', name: 'Hive Tarsus', colonyType: 'mining_and_industry', founder: 'Lord Commander Tarsus',
  starSystem: 'Calixis Sector', description: 'A bustling hive world', ageDays: 360, representativeId: '1',
  planetaryResources: [], hardInfrastructure: [], supportUpgrades: [], developmentPlans: [], customModifiers: [],
}

const mockCalculations: ColonyCalculations = {
  size: { stat: 'size', baseValue: 5, modifiers: [], total: 5, finalValue: 5, loreState: 'freehold', loreLabel: 'Freehold (5)', isCrisis: false, isPositive: false },
  sizeLoreLabel: 'Freehold (5)',
  complacency: { stat: 'complacency', baseValue: 2, modifiers: [], total: 2, finalValue: 2, loreState: 'normal', loreLabel: 'Normal', isCrisis: false, isPositive: false },
  order: { stat: 'order', baseValue: 4, modifiers: [], total: 4, finalValue: 4, loreState: 'stable', loreLabel: 'Stable', isCrisis: false, isPositive: false },
  productivity: { stat: 'productivity', baseValue: 3, modifiers: [], total: 3, finalValue: 3, loreState: 'normal', loreLabel: 'Normal', isCrisis: false, isPositive: false },
  piety: { stat: 'piety', baseValue: 2, modifiers: [], total: 2, finalValue: 2, loreState: 'normal', loreLabel: 'Normal', isCrisis: false, isPositive: false },
  profitFactor: { baseFromSize: 2, stateBonuses: [], modifiers: [], total: 2 },
  activeStateBadges: [],
}

describe('InfrastructurePanelGroup', () => {
  it('renders hard infrastructure section heading', () => {
    renderWithProviders(<InfrastructurePanelGroup colony={mockColony} calculations={mockCalculations} onUpdateColony={() => {}} />)
    expect(screen.getByText(/hard infrastructure systems/i)).toBeInTheDocument()
  })

  it('displays existing hard infrastructure items', () => {
    const colonyWithInfra: Colony = { ...mockColony, hardInfrastructure: [{ id: 'infra-1', name: 'Power Network', type: 'power', status: 'working', notes: 'Main power grid' }] }
    renderWithProviders(<InfrastructurePanelGroup colony={colonyWithInfra} calculations={mockCalculations} onUpdateColony={() => {}} />)
    expect(screen.getByText('Power Network')).toBeInTheDocument()
  })

  it('displays existing development plans', () => {
    const colonyWithPlans: Colony = { ...mockColony, developmentPlans: [{ id: 'plan-1', name: 'Power Expansion', category: 'hard_infrastructure', type: 'power', priority: 5, status: 'planning', description: 'Expand power grid', progress: '' }] }
    renderWithProviders(<InfrastructurePanelGroup colony={colonyWithPlans} calculations={mockCalculations} onUpdateColony={() => {}} />)
    expect(screen.getByText('Power Expansion')).toBeInTheDocument()
  })
})
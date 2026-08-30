import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColonyCreationModal } from './ColonyCreationModal'
import type { Colony, Representative } from '../../types'

const mockOnCreateColony = vi.fn()
const mockOnClose = vi.fn()
const mockOnOpenCreateRepresentative = vi.fn()

const mockRepresentatives: Representative[] = [
  {
    id: 'rep_1',
    name: 'Lord Commander Hestian',
    type: 'military_commander',
    personalities: [{ personalityKey: 'beloved' }],
    characteristics: { ws: 35, bs: 40, s: 35, t: 30, ag: 30, int: 40, per: 35, wp: 45, fel: 30 },
    skills: ['Command'],
    talents: ['Air of Authority'],
    assignedColonyId: null,
  },
]

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onCreateColony: mockOnCreateColony,
  unassignedRepresentatives: mockRepresentatives,
  onOpenCreateRepresentative: mockOnOpenCreateRepresentative,
}

describe('ColonyCreationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders modal with correct title', () => {
      render(<ColonyCreationModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: /charter new rogue trader colony/i })).toBeInTheDocument()
    })

    it('renders subtitle', () => {
      render(<ColonyCreationModal {...defaultProps} />)
      expect(screen.getByText(/establish a permanent imperial domain/i)).toBeInTheDocument()
    })

    it('renders form inputs', () => {
      render(<ColonyCreationModal {...defaultProps} />)
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(4)
    })

    it('displays all colony type options', () => {
      render(<ColonyCreationModal {...defaultProps} />)
      expect(screen.getByText(/research mission/i)).toBeInTheDocument()
      expect(screen.getByText(/mining and industry/i)).toBeInTheDocument()
      expect(screen.getByText(/ecclesiastical/i)).toBeInTheDocument()
      expect(screen.getByText(/agricultural/i)).toBeInTheDocument()
    })
  })

  describe('Colony Type Selection', () => {
    it('shows specialty rule section', () => {
      render(<ColonyCreationModal {...defaultProps} />)
      expect(screen.getByText(/specialty rule:/i)).toBeInTheDocument()
    })
  })

  describe('Representative Selection', () => {
    it('shows representative in selector', () => {
      render(<ColonyCreationModal {...defaultProps} />)
      expect(screen.getByText(/lord commander hestian/i)).toBeInTheDocument()
    })

    it('calls onOpenCreateRepresentative when + New clicked', async () => {
      const user = userEvent.setup()
      render(<ColonyCreationModal {...defaultProps} />)
      const newButton = screen.getByRole('button', { name: /\+ new/i })
      await user.click(newButton)
      expect(mockOnOpenCreateRepresentative).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Submission', () => {
    it('calls onCreateColony with colony data', async () => {
      const user = userEvent.setup()
      render(<ColonyCreationModal {...defaultProps} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.type(inputs[0], 'Outpost Primus')
      await user.type(inputs[1], 'Koronus Expanse')
      await user.clear(inputs[2])
      await user.type(inputs[2], 'Lady Valancius')
      await user.type(inputs[3], 'A mining outpost')
      
      const submitButton = screen.getByRole('button', { name: /issue colony charter/i })
      await user.click(submitButton)
      
      expect(mockOnCreateColony).toHaveBeenCalledTimes(1)
      const colony: Colony = mockOnCreateColony.mock.calls[0][0]
      expect(colony.name).toBe('Outpost Primus')
      expect(colony.starSystem).toBe('Koronus Expanse')
      expect(colony.founder).toBe('Lady Valancius')
      expect(colony.description).toBe('A mining outpost')
      expect(colony.colonyType).toBe('mining_and_industry')
    })

    it('includes default Power Grid infrastructure', async () => {
      const user = userEvent.setup()
      render(<ColonyCreationModal {...defaultProps} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.type(inputs[0], 'Outpost')
      await user.type(inputs[1], 'Koronus')
      await user.clear(inputs[2])
      await user.type(inputs[2], 'Valancius')
      
      await user.click(screen.getByRole('button', { name: /issue colony charter/i }))
      
      const colony: Colony = mockOnCreateColony.mock.calls[0][0]
      expect(colony.hardInfrastructure).toHaveLength(1)
      expect(colony.hardInfrastructure[0].name).toBe('Colony Core Sub-Station')
    })

    it('includes free Industrial Facility for Mining type', async () => {
      const user = userEvent.setup()
      render(<ColonyCreationModal {...defaultProps} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.type(inputs[0], 'Mining Outpost')
      await user.type(inputs[1], 'Koronus')
      await user.clear(inputs[2])
      await user.type(inputs[2], 'Hestian')
      
      await user.click(screen.getByRole('button', { name: /issue colony charter/i }))
      
      const colony: Colony = mockOnCreateColony.mock.calls[0][0]
      expect(colony.supportUpgrades).toHaveLength(1)
      expect(colony.supportUpgrades[0].type).toBe('industrial_facility')
    })

    it('includes free Cultural Improvement for Ecclesiastical', async () => {
      const user = userEvent.setup()
      render(<ColonyCreationModal {...defaultProps} />)
      
      const eccBtn = screen.getByText(/ecclesiastical/i).closest('button')
      if (eccBtn) await user.click(eccBtn)
      
      const inputs = screen.getAllByRole('textbox')
      await user.type(inputs[0], 'Shrine World')
      await user.type(inputs[1], 'Koronus')
      await user.clear(inputs[2])
      await user.type(inputs[2], 'Cardinal')
      
      await user.click(screen.getByRole('button', { name: /issue colony charter/i }))
      
      const colony: Colony = mockOnCreateColony.mock.calls[0][0]
      expect(colony.supportUpgrades).toHaveLength(1)
      expect(colony.supportUpgrades[0].type).toBe('cultural_improvement')
      expect(colony.culturalImprovementStat).toBe('piety')
    })
  })

  describe('Cancel Button', () => {
    it('calls onClose when cancel clicked', async () => {
      const user = userEvent.setup()
      render(<ColonyCreationModal {...defaultProps} />)
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnCreateColony).not.toHaveBeenCalled()
    })
  })
})

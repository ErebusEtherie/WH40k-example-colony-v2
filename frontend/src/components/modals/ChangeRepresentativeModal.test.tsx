import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangeRepresentativeModal } from './ChangeRepresentativeModal'
import type { Colony, Representative } from '../../types'

const mockOnAssignRepresentative = vi.fn()
const mockOnClose = vi.fn()
const mockOnOpenCreateRepresentative = vi.fn()

const mockColony: Colony = {
  id: 'colony_1',
  name: 'Test Colony',
  starSystem: 'Calixis Sector',
  colonyType: 'mining_and_industry',
  founder: 'Lord Commander',
  ageDays: 365,
  representativeId: null,
  planetaryResources: [],
  hardInfrastructure: [],
  supportUpgrades: [],
  developmentPlans: [],
  customModifiers: [],
}

const mockRepresentatives: Representative[] = [
  {
    id: 'rep_1',
    name: 'Lord Hestian',
    type: 'satrap',
    personalities: [{ personalityKey: 'beloved' }],
    characteristics: { ws: 35, bs: 35, s: 30, t: 35, ag: 30, int: 40, per: 35, wp: 40, fel: 50 },
    skills: ['Charm'],
    talents: [],
    assignedColonyId: null,
  },
  {
    id: 'rep_2',
    name: 'Inquisitor Varr',
    type: 'judge',
    personalities: [{ personalityKey: 'feared' }],
    characteristics: { ws: 40, bs: 45, s: 35, t: 40, ag: 35, int: 50, per: 45, wp: 50, fel: 45 },
    skills: ['Intimidate'],
    talents: [],
    assignedColonyId: null,
  },
]

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  colony: mockColony,
  representatives: mockRepresentatives,
  onAssignRepresentative: mockOnAssignRepresentative,
  onOpenCreateRepresentative: mockOnOpenCreateRepresentative,
}

describe('ChangeRepresentativeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders modal with correct title and subtitle', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: /reassign colony representative/i })).toBeInTheDocument()
      expect(screen.getByText(/appoint a new magistrate/i)).toBeInTheDocument()
    })

    it('displays warning banner', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      expect(screen.getByText(/administrative protocol notice/i)).toBeInTheDocument()
      expect(screen.getByText(/changing representative immediately/i)).toBeInTheDocument()
    })

    it('shows available representatives count', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      expect(screen.getByText(/available representatives in dynasty pool \(2\)/i)).toBeInTheDocument()
    })

    it('displays vacate post option', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      expect(screen.getByText(/vacate post/i)).toBeInTheDocument()
      expect(screen.getByText(/no representative/i)).toBeInTheDocument()
    })

    it('shows all representative candidates', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      expect(screen.getByText('Lord Hestian')).toBeInTheDocument()
      expect(screen.getByText('Inquisitor Varr')).toBeInTheDocument()
    })

    it('displays representative type badges', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      expect(screen.getByText(/satrap/i)).toBeInTheDocument()
      expect(screen.getByText(/judge/i)).toBeInTheDocument()
    })

    it('shows representative stats', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      // Both representatives have 1 personality trait each
      expect(screen.getAllByText(/1 Trait/i)).toHaveLength(2)
      expect(screen.getByText(/ws 35/i)).toBeInTheDocument()
      expect(screen.getByText(/fel 50/i)).toBeInTheDocument()
    })

    it('displays commission new button', () => {
      render(<ChangeRepresentativeModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /commission new/i })).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('selects vacate post option when clicked', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      const vacateButton = screen.getByTestId('vacate-post-option')
      await user.click(vacateButton)
      
      expect(vacateButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('selects representative when clicked', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      const repButton = screen.getByTestId('rep-option-rep_1')
      await user.click(repButton)
      
      expect(repButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows checkmark for selected option', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      const repButton = screen.getByTestId('rep-option-rep_1')
      await user.click(repButton)
      
      // Check that selected option has aria-pressed set to true
      expect(repButton).toHaveAttribute('aria-pressed', 'true')
      // Verify the checkmark icon appears for the selected representative
      expect(repButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Confirm Assignment', () => {
    it('calls onAssignRepresentative with colony id and rep id', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      const repButton = screen.getByTestId('rep-option-rep_1')
      await user.click(repButton)
      await user.click(screen.getByRole('button', { name: /confirm appointment/i }))
      
      expect(mockOnAssignRepresentative).toHaveBeenCalledTimes(1)
      expect(mockOnAssignRepresentative).toHaveBeenCalledWith('colony_1', 'rep_1')
    })

    it('calls onAssignRepresentative with null for vacate post', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      const vacateButton = screen.getByTestId('vacate-post-option')
      await user.click(vacateButton)
      await user.click(screen.getByRole('button', { name: /confirm appointment/i }))
      
      expect(mockOnAssignRepresentative).toHaveBeenCalledTimes(1)
      expect(mockOnAssignRepresentative).toHaveBeenCalledWith('colony_1', null)
    })

    it('closes modal after confirmation', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      const repButton = screen.getByTestId('rep-option-rep_1')
      await user.click(repButton)
      await user.click(screen.getByRole('button', { name: /confirm appointment/i }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Commission New Representative', () => {
    it('closes modal and opens create representative modal', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /commission new/i }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnOpenCreateRepresentative).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cancel Button', () => {
    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<ChangeRepresentativeModal {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnAssignRepresentative).not.toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('handles empty representatives list', () => {
      render(
        <ChangeRepresentativeModal
          {...defaultProps}
          representatives={[]}
        />
      )
      expect(screen.getByText(/available representatives in dynasty pool \(0\)/i)).toBeInTheDocument()
      // Verify only "Vacate Post" option is available
      expect(screen.getByTestId('vacate-post-option')).toBeInTheDocument()
      expect(screen.queryByTestId('rep-option-rep_1')).not.toBeInTheDocument()
    })
  })

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ChangeRepresentativeModal
          {...defaultProps}
          isOpen={false}
        />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Colony with existing representative', () => {
    it('pre-selects current representative', () => {
      const colonyWithRep: Colony = {
        ...mockColony,
        representativeId: 'rep_2',
      }
      
      render(
        <ChangeRepresentativeModal
          {...defaultProps}
          colony={colonyWithRep}
        />
      )
      
      const selectedRep = screen.getByTestId('rep-option-rep_2')
      expect(selectedRep).toHaveAttribute('aria-pressed', 'true')
    })
  })
})

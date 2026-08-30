import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RepresentativeCreationModal } from './RepresentativeCreationModal'
import type { Representative } from '../../types'

const mockOnCreateRepresentative = vi.fn()
const mockOnClose = vi.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onCreateRepresentative: mockOnCreateRepresentative,
}

describe('RepresentativeCreationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders modal with correct title', () => {
      render(<RepresentativeCreationModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: /commission new imperial representative/i })).toBeInTheDocument()
    })

    it('shows step tabs', () => {
      render(<RepresentativeCreationModal {...defaultProps} />)
      expect(screen.getByText(/identity & type/i)).toBeInTheDocument()
      expect(screen.getAllByText(/personalities/i)).toHaveLength(2)
      expect(screen.getByText(/characteristics/i)).toBeInTheDocument()
    })

    it('shows representative name input', () => {
      render(<RepresentativeCreationModal {...defaultProps} />)
      expect(screen.getByLabelText(/representative name/i)).toBeInTheDocument()
    })

    it('displays representative type options', () => {
      render(<RepresentativeCreationModal {...defaultProps} />)
      expect(screen.getAllByText(/satrap/i)).toHaveLength(2)
      expect(screen.getByText(/judge/i)).toBeInTheDocument()
      expect(screen.getByText(/cardinal/i)).toBeInTheDocument()
    })
  })

  describe('Form Flow', () => {
    it('proceeds through steps to final submission', async () => {
      const user = userEvent.setup()
      render(<RepresentativeCreationModal {...defaultProps} />)
      
      // Step 1: Enter name
      const nameInput = screen.getByLabelText(/representative name/i)
      await user.type(nameInput, 'Lord Hestian')
      
      // Click Next (Proceed to Personalities)
      await user.click(screen.getByRole('button', { name: /proceed to personalities/i }))
      
      // Step 2: Click Next (Characteristics & Skills)
      await user.click(screen.getByRole('button', { name: /characteristics & skills/i }))
      
      // Step 3: Click Commission
      await user.click(screen.getByRole('button', { name: /commission representative/i }))
      
      expect(mockOnCreateRepresentative).toHaveBeenCalledTimes(1)
      const rep: Representative = mockOnCreateRepresentative.mock.calls[0][0]
      expect(rep.name).toBe('Lord Hestian')
    })

    it('can go back from step 2 to step 1', async () => {
      const user = userEvent.setup()
      render(<RepresentativeCreationModal {...defaultProps} />)
      
      const nameInput = screen.getByLabelText(/representative name/i)
      await user.type(nameInput, 'Test Rep')
      await user.click(screen.getByRole('button', { name: /proceed to personalities/i }))
      
      expect(screen.getAllByText(/personalities/i)).toHaveLength(2)
      
      await user.click(screen.getByRole('button', { name: /back/i }))
      
      expect(screen.getByText(/representative archetype/i)).toBeInTheDocument()
    })
  })

  describe('Cancel', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<RepresentativeCreationModal {...defaultProps} />)
      
      const closeButton = screen.getByLabelText(/close dialog/i)
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})

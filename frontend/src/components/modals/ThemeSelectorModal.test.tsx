import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSelectorModal } from './ThemeSelectorModal'
import type { AppTheme } from '../../types'

const mockOnSelectTheme = vi.fn()
const mockOnClose = vi.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  currentTheme: 'canonical_mechanicum' as AppTheme,
  onSelectTheme: mockOnSelectTheme,
}

describe('ThemeSelectorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders modal with correct title', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: /select imperial theme/i })).toBeInTheDocument()
    })

    it('displays aesthetic engine badge', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByText(/aesthetic engine/i)).toBeInTheDocument()
      expect(screen.getByText(/data-slate appearance/i)).toBeInTheDocument()
    })

    it('shows instruction text', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByText(/select an aesthetic protocol/i)).toBeInTheDocument()
    })

    it('displays all theme options', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getAllByText(/mechanicum data-slate/i)).toHaveLength(2)
      expect(screen.getByText(/omnissiah shrine/i)).toBeInTheDocument()
      expect(screen.getByText(/gothic voidfarer/i)).toBeInTheDocument()
      expect(screen.getByText(/inquisition sanctum/i)).toBeInTheDocument()
      expect(screen.getByText(/tactical auspex/i)).toBeInTheDocument()
      expect(screen.getByText(/imperial parchment/i)).toBeInTheDocument()
    })

    it('shows theme badges', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByText(/spec-canonical/i)).toBeInTheDocument()
      expect(screen.getAllByText(/classified/i)).not.toHaveLength(0)
    })

    it('displays theme descriptions', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByText(/canonical mechanicum design system/i)).toBeInTheDocument()
    })

    it('shows color swatches for each theme', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      const swatchContainers = screen.getAllByRole('button', { name: /apply|selected/i })
      expect(swatchContainers.length).toBeGreaterThanOrEqual(6)
    })

    it('highlights current theme as active', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByText(/active protocol/i)).toBeInTheDocument()
    })

    it('shows apply button for non-selected themes', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      const applyButtons = screen.getAllByRole('button', { name: /apply/i })
      expect(applyButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('shows selected button for current theme', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /selected/i })).toBeInTheDocument()
    })

    it('displays persistence notice', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByText(/persists automatically/i)).toBeInTheDocument()
    })

    it('has done button', () => {
      render(<ThemeSelectorModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
    })
  })

  describe('Theme Selection', () => {
    it('calls onSelectTheme when theme card is clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeSelectorModal {...defaultProps} />)
      
      // Click on the Omnissiah theme card
      const omnissiahCard = screen.getByText(/omnissiah shrine/i).closest('div')
      await user.click(omnissiahCard!)
      
      expect(mockOnSelectTheme).toHaveBeenCalledTimes(1)
      expect(mockOnSelectTheme).toHaveBeenCalledWith('darktide_forge')
    })

    it('calls onSelectTheme when apply button is clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeSelectorModal {...defaultProps} />)
      
      // Get the first apply button (for a non-selected theme)
      const applyButtons = screen.getAllByRole('button', { name: /apply/i })
      await user.click(applyButtons[0])
      
      expect(mockOnSelectTheme).toHaveBeenCalledTimes(1)
    })
  })

  describe('Close Actions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeSelectorModal {...defaultProps} />)
      
      await user.click(screen.getByLabelText(/close modal/i))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when done button is clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeSelectorModal {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /done/i }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Modal visibility', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <ThemeSelectorModal
          isOpen={false}
          onClose={mockOnClose}
          currentTheme='canonical_mechanicum'
          onSelectTheme={mockOnSelectTheme}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })
  })
})

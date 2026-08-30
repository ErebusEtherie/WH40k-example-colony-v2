import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddCustomModifierModal } from './AddCustomModifierModal'
import type { CustomModifierItem } from '../../types'

const mockOnAddModifier = vi.fn()
const mockOnClose = vi.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onAddModifier: mockOnAddModifier,
}

describe('AddCustomModifierModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders modal with correct title and subtitle', () => {
      render(<AddCustomModifierModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: /add custom modifier/i })).toBeInTheDocument()
      expect(screen.getByText(/log tabletop narrative event outcomes/i)).toBeInTheDocument()
    })

    it('displays all form fields', () => {
      render(<AddCustomModifierModal {...defaultProps} />)
      expect(screen.getByPlaceholderText(/planetary triumph/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/session 14/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/additional narrative details/i)).toBeInTheDocument()
    })

    it('shows all stat options in dropdown', () => {
      render(<AddCustomModifierModal {...defaultProps} />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('complacency')
      
      expect(screen.getByText('Complacency')).toBeInTheDocument()
      expect(screen.getByText('Order')).toBeInTheDocument()
      expect(screen.getByText('Productivity')).toBeInTheDocument()
      expect(screen.getByText('Piety')).toBeInTheDocument()
      expect(screen.getByText(/size/i)).toBeInTheDocument()
      expect(screen.getByText(/profit factor/i)).toBeInTheDocument()
    })

    it('displays imperial protocol notice', () => {
      render(<AddCustomModifierModal {...defaultProps} />)
      expect(screen.getByText(/imperial protocol:/i)).toBeInTheDocument()
      expect(screen.getByText(/inactive/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('has submit button enabled when value is 1 (default)', () => {
      render(<AddCustomModifierModal {...defaultProps} />)
      const submitButton = screen.getByRole('button', { name: /log custom modifier/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('disables submit button when value is cleared to 0', async () => {
      const user = userEvent.setup()
      render(<AddCustomModifierModal {...defaultProps} />)
      
      const valueInput = screen.getByRole('spinbutton')
      await user.clear(valueInput)
      await user.type(valueInput, '0')
      
      const submitButton = screen.getByRole('button', { name: /log custom modifier/i })
      expect(submitButton).toBeDisabled()
    })

    it('requires name field (HTML5 validation)', () => {
      render(<AddCustomModifierModal {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText(/planetary triumph/i)
      expect(nameInput).toHaveAttribute('required')
    })

    it('requires source field (HTML5 validation)', () => {
      render(<AddCustomModifierModal {...defaultProps} />)
      const sourceInput = screen.getByPlaceholderText(/session 14/i)
      expect(sourceInput).toHaveAttribute('required')
    })
  })

  describe('Form Submission', () => {
    it('calls onAddModifier with correct data on submit', async () => {
      const user = userEvent.setup()
      render(<AddCustomModifierModal {...defaultProps} />)
      
      await user.type(screen.getByPlaceholderText(/planetary triumph/i), 'Planetary Triumph')
      await user.selectOptions(screen.getByRole('combobox'), 'order')
      
      const valueInput = screen.getByRole('spinbutton')
      await user.clear(valueInput)
      await user.type(valueInput, '-3')
      
      await user.clear(screen.getByPlaceholderText(/session 14/i))
      await user.type(screen.getByPlaceholderText(/session 14/i), 'Session 14')
      await user.type(screen.getByPlaceholderText(/additional narrative details/i), 'Festival')
      
      await user.click(screen.getByRole('button', { name: /log custom modifier/i }))
      
      expect(mockOnAddModifier).toHaveBeenCalledTimes(1)
      const modifier: CustomModifierItem = mockOnAddModifier.mock.calls[0][0]
      
      expect(modifier.name).toBe('Planetary Triumph')
      expect(modifier.stat).toBe('order')
      expect(modifier.value).toBe(3)
      expect(modifier.source).toBe('Session 14')
      expect(modifier.notes).toBe('Festival')
      expect(modifier.category).toBe('custom')
      expect(modifier.isActive).toBe(false)
      expect(modifier.id).toMatch(/custom_mod_/)
    })

    it('submits with negative value', async () => {
      const user = userEvent.setup()
      render(<AddCustomModifierModal {...defaultProps} />)
      
      await user.type(screen.getByPlaceholderText(/planetary triumph/i), 'Cult Uprising')
      
      const valueInput = screen.getByRole('spinbutton')
      fireEvent.change(valueInput, { target: { value: '-2' } })
      
      await user.type(screen.getByPlaceholderText(/session 14/i), 'Event')
      await user.click(screen.getByRole('button', { name: /log custom modifier/i }))
      
      expect(mockOnAddModifier).toHaveBeenCalledTimes(1)
      const modifier: CustomModifierItem = mockOnAddModifier.mock.calls[0][0]
      expect(modifier.value).toBe(-2)
    })

    it('submits with profit_factor stat', async () => {
      const user = userEvent.setup()
      render(<AddCustomModifierModal {...defaultProps} />)
      
      await user.type(screen.getByPlaceholderText(/planetary triumph/i), 'Trade Windfall')
      await user.selectOptions(screen.getByRole('combobox'), 'profit_factor')
      
      const valueInput = screen.getByRole('spinbutton')
      await user.clear(valueInput)
      await user.type(valueInput, '5')
      
      await user.type(screen.getByPlaceholderText(/session 14/i), 'Trade')
      await user.click(screen.getByRole('button', { name: /log custom modifier/i }))
      
      expect(mockOnAddModifier).toHaveBeenCalledTimes(1)
      const modifier: CustomModifierItem = mockOnAddModifier.mock.calls[0][0]
      expect(modifier.stat).toBe('profit_factor')
    })

    it('submits without notes (optional field)', async () => {
      const user = userEvent.setup()
      render(<AddCustomModifierModal {...defaultProps} />)
      
      await user.type(screen.getByPlaceholderText(/planetary triumph/i), 'Quick Event')
      
      const valueInput = screen.getByRole('spinbutton')
      await user.clear(valueInput)
      await user.type(valueInput, '1')
      
      await user.type(screen.getByPlaceholderText(/session 14/i), 'Session')
      await user.click(screen.getByRole('button', { name: /log custom modifier/i }))
      
      expect(mockOnAddModifier).toHaveBeenCalledTimes(1)
      const modifier: CustomModifierItem = mockOnAddModifier.mock.calls[0][0]
      expect(modifier.notes).toBeUndefined()
    })
  })

  describe('Cancel Button', () => {
    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<AddCustomModifierModal {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnAddModifier).not.toHaveBeenCalled()
    })
  })

  describe('Form Reset', () => {
    it('resets form after successful submission', async () => {
      const user = userEvent.setup()
      render(<AddCustomModifierModal {...defaultProps} />)
      
      await user.type(screen.getByPlaceholderText(/planetary triumph/i), 'Test Event')
      
      const valueInput = screen.getByRole('spinbutton')
      await user.clear(valueInput)
      await user.type(valueInput, '2')
      
      await user.type(screen.getByPlaceholderText(/session 14/i), 'Test Source')
      await user.click(screen.getByRole('button', { name: /log custom modifier/i }))
      
      expect(screen.getByPlaceholderText(/planetary triumph/i)).toHaveValue('')
      expect(screen.getByPlaceholderText(/session 14/i)).toHaveValue('Tabletop GM Ruling')
    })
  })
})

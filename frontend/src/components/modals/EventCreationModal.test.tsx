import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCreationModal } from './EventCreationModal'
import type { Event } from '../../types'

const mockOnSubmit = vi.fn()
const mockOnClose = vi.fn()
const defaultProps = { isOpen: true, onClose: mockOnClose, onSubmit: mockOnSubmit, existingEvent: null }

describe('EventCreationModal', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders modal with correct title when creating new event', () => {
    render(<EventCreationModal {...defaultProps} />)
    expect(screen.getByRole('heading', { name: /create event/i })).toBeInTheDocument()
  })

  it('renders modal with correct title when editing existing event', () => {
    const existingEvent: Event = { id: 1, colony_id: 1, name: 'Warp Storm', description: 'A violent warp storm', created_by: 1, created_at: '2026-08-30T00:00:00Z', is_active: true, modifiers: [] }
    render(<EventCreationModal {...defaultProps} existingEvent={existingEvent} />)
    expect(screen.getByText(/edit event/i)).toBeInTheDocument()
  })

  it('requires event name to submit', async () => {
    const user = userEvent.setup()
    render(<EventCreationModal {...defaultProps} />)
    const submitButton = screen.getByRole('button', { name: /create event/i })
    expect(submitButton).toBeDisabled()
    const nameInput = screen.getByLabelText(/event name/i)
    await user.type(nameInput, 'Test Event')
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSubmit with event data when form is submitted', async () => {
    const user = userEvent.setup()
    render(<EventCreationModal {...defaultProps} />)
    const nameInput = screen.getByLabelText(/event name/i)
    await user.type(nameInput, 'Warp Storm')
    const submitButton = screen.getByRole('button', { name: /create event/i })
    await user.click(submitButton)
    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'Warp Storm', description: '', modifiers: [] })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<EventCreationModal {...defaultProps} />)
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalled()
  })
})
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from './EventCard'
import type { Event } from '../../types'

const mockEvent: Event = {
  id: 1,
  colony_id: 1,
  name: 'Warp Storm',
  description: 'A violent warp storm has isolated the colony.',
  created_by: 1,
  created_at: '2026-08-30T00:00:00Z',
  is_active: true,
  modifiers: [
    { stat: 'productivity', value: -2, description: 'Trade disruption' },
    { stat: 'order', value: -1, description: 'Communication breakdown' },
  ],
}

describe('EventCard', () => {
  it('renders event name and description', () => {
    render(
      <EventCard
        event={mockEvent}
        onToggleActive={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText('Warp Storm')).toBeInTheDocument()
    expect(screen.getByText(/violent warp storm/i)).toBeInTheDocument()
  })

  it('renders active status badge', () => {
    render(
      <EventCard
        event={mockEvent}
        onToggleActive={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })

  it('renders modifiers with correct values', () => {
    render(
      <EventCard
        event={mockEvent}
        onToggleActive={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText(/productivity/i)).toBeInTheDocument()
    expect(screen.getByText('-2')).toBeInTheDocument()
    expect(screen.getByText(/Trade disruption/i)).toBeInTheDocument()
  })

  it('calls onToggleActive when toggle button is clicked', async () => {
    const onToggleActive = vi.fn()
    const user = userEvent.setup()

    render(
      <EventCard
        event={mockEvent}
        onToggleActive={onToggleActive}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const toggleButton = screen.getByTitle(/deactivate event/i)
    await user.click(toggleButton)

    expect(onToggleActive).toHaveBeenCalledWith(1, false)
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()

    render(
      <EventCard
        event={mockEvent}
        onToggleActive={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    )

    const editButton = screen.getByTitle(/edit event/i)
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockEvent)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()

    render(
      <EventCard
        event={mockEvent}
        onToggleActive={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    )

    const deleteButton = screen.getByTitle(/delete event/i)
    await user.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('renders inactive status for inactive event', () => {
    const inactiveEvent: Event = {
      ...mockEvent,
      is_active: false,
    }

    render(
      <EventCard
        event={inactiveEvent}
        onToggleActive={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText(/inactive/i)).toBeInTheDocument()
  })
})
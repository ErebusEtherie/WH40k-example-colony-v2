import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RepresentativePanel } from './RepresentativePanel'
import type { Representative, Colony } from '../../types'

const mockRepresentatives: Representative[] = [
  {
    id: '1',
    name: 'Inquisitor Malchus',
    type: 'dynasty_member',
    assignedColonyId: '1',
    personalities: [{ personalityKey: 'judicious' }, { personalityKey: 'ruthless' }],
    characteristics: { ws: 3, bs: 4, s: 3, t: 4, ag: 3, int: 5, per: 4, wp: 5, fel: 3 },
    skills: ['Awareness', 'Command'],
    talents: ['Air of Authority'],
  },
]

const mockColonies: Colony[] = [
  { id: '1', name: 'Hive Tarsus', colonyType: 'mining_and_industry', founder: 'Lord Commander Tarsus', starSystem: 'Calixis Sector', description: '', ageDays: 360, representativeId: '1', planetaryResources: [], hardInfrastructure: [], supportUpgrades: [], developmentPlans: [], customModifiers: [] },
]

const mockProps = {
  representatives: mockRepresentatives,
  selectedRepId: '1',
  onSelectRep: vi.fn(),
  onUpdateRepresentative: vi.fn(),
  onOpenCreateRepresentative: vi.fn(),
  colonies: mockColonies,
  currentColony: mockColonies[0],
  onAssignToColony: vi.fn(),
}

describe('RepresentativePanel', () => {
  it('renders representative name and type', () => {
    render(<RepresentativePanel {...mockProps} />)
    expect(screen.getByRole('heading', { name: /inquisitor malchus/i })).toBeInTheDocument()
  })

  it('displays representative characteristics', () => {
    render(<RepresentativePanel {...mockProps} />)
    expect(screen.getByText(/characteristics/i)).toBeInTheDocument()
  })

  it('displays personality traits', () => {
    render(<RepresentativePanel {...mockProps} />)
    expect(screen.getByText(/judicious/i)).toBeInTheDocument()
    expect(screen.getByText(/ruthless/i)).toBeInTheDocument()
  })

  it('displays skills', () => {
    render(<RepresentativePanel {...mockProps} />)
    expect(screen.getByText('Awareness')).toBeInTheDocument()
    expect(screen.getByText('Command')).toBeInTheDocument()
  })

  it('displays talents', () => {
    render(<RepresentativePanel {...mockProps} />)
    expect(screen.getByText(/air of authority/i)).toBeInTheDocument()
  })

  it('allows editing representative name', async () => {
    const user = userEvent.setup()
    const onUpdateRepresentative = vi.fn()
    render(<RepresentativePanel {...mockProps} onUpdateRepresentative={onUpdateRepresentative} />)
    
    const editButton = screen.getByRole('button', { name: /edit name/i })
    await user.click(editButton)
    
    const nameInput = screen.getByDisplayValue('Inquisitor Malchus')
    await user.clear(nameInput)
    await user.type(nameInput, 'Inquisitor NewName')
    
    // Click the save button (Check icon)
    const buttons = screen.getAllByRole('button')
    const saveButton = buttons.find(btn => btn.querySelector('svg.lucide-check'))
    if (saveButton) await user.click(saveButton)
    
    expect(onUpdateRepresentative).toHaveBeenCalledWith('1', { name: 'Inquisitor NewName' })
  })

  it('allows adding new skills', async () => {
    const user = userEvent.setup()
    const onUpdateRepresentative = vi.fn()
    render(<RepresentativePanel {...mockProps} onUpdateRepresentative={onUpdateRepresentative} />)
    
    const skillInput = screen.getByPlaceholderText(/add skill/i)
    await user.type(skillInput, 'Deception')
    
    const addButton = screen.getByRole('button', { name: /add skill/i })
    await user.click(addButton)
    
    expect(onUpdateRepresentative).toHaveBeenCalledWith('1', {
      skills: ['Awareness', 'Command', 'Deception'],
    })
  })

  it('allows removing skills', async () => {
    const user = userEvent.setup()
    const onUpdateRepresentative = vi.fn()
    render(<RepresentativePanel {...mockProps} onUpdateRepresentative={onUpdateRepresentative} />)
    
    const removeButton = screen.getByTitle(/remove awareness/i)
    await user.click(removeButton)
    
    expect(onUpdateRepresentative).toHaveBeenCalledWith('1', {
      skills: ['Command'],
    })
  })

  it('allows adding new talents', async () => {
    const user = userEvent.setup()
    const onUpdateRepresentative = vi.fn()
    render(<RepresentativePanel {...mockProps} onUpdateRepresentative={onUpdateRepresentative} />)
    
    const talentInput = screen.getByPlaceholderText(/add talent/i)
    await user.type(talentInput, 'Master Orator')
    
    const addButton = screen.getByRole('button', { name: /add talent/i })
    await user.click(addButton)
    
    expect(onUpdateRepresentative).toHaveBeenCalledWith('1', {
      talents: ['Air of Authority', 'Master Orator'],
    })
  })

  it('allows removing talents', async () => {
    const user = userEvent.setup()
    const onUpdateRepresentative = vi.fn()
    render(<RepresentativePanel {...mockProps} onUpdateRepresentative={onUpdateRepresentative} />)
    
    const removeButton = screen.getByTitle(/remove air of authority/i)
    await user.click(removeButton)
    
    expect(onUpdateRepresentative).toHaveBeenCalledWith('1', {
      talents: [],
    })
  })

  it('shows empty state when no representatives exist', () => {
    render(<RepresentativePanel {...mockProps} representatives={[]} />)
    expect(screen.getByText(/no representatives in dynasty registry/i)).toBeInTheDocument()
  })

  it('calls onOpenCreateRepresentative when commission button is clicked in empty state', async () => {
    const user = userEvent.setup()
    const onOpenCreateRepresentative = vi.fn()
    render(<RepresentativePanel {...mockProps} representatives={[]} onOpenCreateRepresentative={onOpenCreateRepresentative} />)
    
    const commissionButton = screen.getByRole('button', { name: /commission new representative/i })
    await user.click(commissionButton)
    
    expect(onOpenCreateRepresentative).toHaveBeenCalled()
  })
})

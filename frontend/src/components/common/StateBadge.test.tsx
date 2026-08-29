import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StateBadge } from './StateBadge'

describe('StateBadge', () => {
  it('renders stable order state', () => {
    render(<StateBadge stat="order" state="Stable" label="Stable" type="stable" />)
    
    expect(screen.getByText(/stable/i)).toBeInTheDocument()
  })

  it('renders anarchy state with correct styling', () => {
    render(<StateBadge stat="order" state="Anarchy" label="Anarchy" type="crisis" />)
    
    expect(screen.getByText(/anarchy/i)).toBeInTheDocument()
  })

  it('renders placated complacency state', () => {
    render(<StateBadge stat="complacency" state="Placated" label="Placated" type="positive" />)
    
    expect(screen.getByText(/placated/i)).toBeInTheDocument()
  })

  it('renders productive state', () => {
    render(<StateBadge stat="productivity" state="Productive" label="Productive" type="positive" />)
    
    expect(screen.getByText(/productive/i)).toBeInTheDocument()
  })

  it('renders halted state', () => {
    render(<StateBadge stat="productivity" state="Halted" label="Halted" type="crisis" />)
    
    expect(screen.getByText(/halted/i)).toBeInTheDocument()
  })

  it('renders pious state', () => {
    render(<StateBadge stat="piety" state="Pious" label="Pious" type="positive" />)
    
    expect(screen.getByText(/pious/i)).toBeInTheDocument()
  })

  it('renders heretical state', () => {
    render(<StateBadge stat="piety" state="Heretical" label="Heretical" type="crisis" />)
    
    expect(screen.getByText(/heretical/i)).toBeInTheDocument()
  })
})
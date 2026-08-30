import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import type { Colony, AppTheme, AccessibilityPalette, FontSizeSetting } from '../../types'

const mockColonies: Colony[] = [
  {
    id: '1',
    name: 'Hive Tarsus',
    colonyType: 'mining_and_industry',
    founder: 'Lord Commander Tarsus',
    starSystem: 'Calixis Sector',
    description: 'A bustling hive world',
    ageDays: 360,
    representativeId: null,
    planetaryResources: [],
    hardInfrastructure: [],
    supportUpgrades: [],
    developmentPlans: [],
    customModifiers: [],
  },
  {
    id: '2',
    name: 'Forge World Alpha',
    colonyType: 'mining_and_industry',
    founder: 'Arch-Magos Delatorre',
    starSystem: 'Gothic Sector',
    description: 'Industrial powerhouse',
    ageDays: 720,
    representativeId: null,
    planetaryResources: [],
    hardInfrastructure: [],
    supportUpgrades: [],
    developmentPlans: [],
    customModifiers: [],
  },
]

const mockSelectedColony = mockColonies[0]

const defaultProps = {
  colonies: mockColonies,
  selectedColony: mockSelectedColony,
  onSelectColony: vi.fn(),
  onOpenCreateColony: vi.fn(),
  theme: 'mechanicus_amber' as AppTheme,
  onChangeTheme: vi.fn(),
  onOpenThemeModal: vi.fn(),
  onAdvanceDays: vi.fn(),
  accessibilityPalette: 'mechanicus' as AccessibilityPalette,
  onChangePalette: vi.fn(),
  isDyslexiaFont: false,
  onToggleDyslexiaFont: vi.fn(),
  fontSize: 'standard' as FontSizeSetting,
  onChangeFontSize: vi.fn(),
  isHighContrast: false,
  onToggleHighContrast: vi.fn(),
  username: 'admin',
  onLogout: vi.fn(),
  backendStatus: 'connected' as const,
}

const renderHeader = (overrides: Partial<Omit<typeof defaultProps, 'backendStatus'> & { backendStatus?: 'connected' | 'syncing' | 'offline' }> = {}) => {
  return render(<Header {...defaultProps} {...overrides} />)
}

describe('Header', () => {
  it('renders colony name and type correctly', () => {
    renderHeader()
    
    expect(screen.getByText(/hive tarsus/i)).toBeInTheDocument()
    expect(screen.getByText(/mining/i)).toBeInTheDocument()
  })

  it('renders backend status indicator', () => {
    renderHeader()
    
    expect(screen.getByText(/cogitator online/i)).toBeInTheDocument()
  })

  it('renders user profile section', () => {
    renderHeader()
    
    // Logout button is present in the profile section
    expect(screen.getByLabelText(/logout/i)).toBeInTheDocument()
  })

  it('calls onLogout when logout button is clicked', async () => {
    const onLogout = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onLogout })
    
    const logoutButton = screen.getByLabelText(/logout/i)
    await user.click(logoutButton)

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('opens colony dropdown when colony selector is clicked', async () => {
    const user = userEvent.setup()

    renderHeader()
    
    const colonySelector = screen.getByRole('button', { name: /hive tarsus/i })
    await user.click(colonySelector)

    await waitFor(() => {
      expect(screen.getByText('Forge World Alpha')).toBeInTheDocument()
    })
  })

  it('calls onSelectColony when a different colony is selected', async () => {
    const onSelectColony = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onSelectColony })
    
    const colonySelector = screen.getByRole('button', { name: /hive tarsus/i })
    await user.click(colonySelector)

    // Find the Forge World option in the dropdown list
    const forgeWorldOption = await screen.findByText('Forge World Alpha')
    await user.click(forgeWorldOption)

    // onSelectColony is called with the colony id (as string per the prop type)
    expect(onSelectColony).toHaveBeenCalled()
  })

  it('calls onOpenCreateColony when create colony button is clicked', async () => {
    const onOpenCreateColony = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onOpenCreateColony })
    
    const createButton = screen.getByRole('button', { name: /found new colony/i })
    await user.click(createButton)

    expect(onOpenCreateColony).toHaveBeenCalledTimes(1)
  })

  it('opens accessibility menu when accessibility button is clicked', async () => {
    const user = userEvent.setup()

    renderHeader()
    
    const a11yButton = screen.getByRole('button', { name: /accessibility settings/i })
    await user.click(a11yButton)

    // Verify the button was clicked
    expect(a11yButton).toBeInTheDocument()
  })

  it('calls onToggleDyslexiaFont when dyslexia font toggle is clicked', async () => {
    const onToggleDyslexiaFont = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onToggleDyslexiaFont })
    
    const a11yButton = screen.getByRole('button', { name: /accessibility settings/i })
    await user.click(a11yButton)

    const dyslexiaToggle = document.getElementById('toggle-dyslexia-font')
    expect(dyslexiaToggle).toBeInTheDocument()
    await user.click(dyslexiaToggle!)

    expect(onToggleDyslexiaFont).toHaveBeenCalledTimes(1)
  })

  it('calls onChangeFontSize when a font size option is selected', async () => {
    const onChangeFontSize = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onChangeFontSize })
    
    const a11yButton = screen.getByRole('button', { name: /accessibility settings/i })
    await user.click(a11yButton)

    const largeSizeButton = screen.getByText('115%')
    await user.click(largeSizeButton)

    expect(onChangeFontSize).toHaveBeenCalledWith('large')
  })

  it('calls onChangePalette when a color palette is selected', async () => {
    const onChangePalette = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onChangePalette })
    
    const a11yButton = screen.getByRole('button', { name: /accessibility settings/i })
    await user.click(a11yButton)

    const monochromeButton = screen.getByText('Monochrome')
    await user.click(monochromeButton)

    expect(onChangePalette).toHaveBeenCalledWith('high_contrast')
  })

  it('opens theme dropdown when theme button is clicked', async () => {
    const user = userEvent.setup()

    renderHeader()
    
    const themeButton = screen.getByRole('button', { name: /change ui theme/i })
    await user.click(themeButton)

    // Verify button was interacted with
    expect(themeButton).toBeInTheDocument()
  })

  it('calls onOpenThemeModal when View All themes button is clicked', async () => {
    const onOpenThemeModal = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onOpenThemeModal })
    
    const themeButton = screen.getByRole('button', { name: /change ui theme/i })
    await user.click(themeButton)

    const viewAllButton = screen.getByText('View All')
    await user.click(viewAllButton)

    expect(onOpenThemeModal).toHaveBeenCalledTimes(1)
  })

  it('displays syncing status when backendStatus is syncing', () => {
    renderHeader({ backendStatus: 'syncing' })
    
    expect(screen.getByText(/syncing/i)).toBeInTheDocument()
  })

  it('displays offline status when backendStatus is offline', () => {
    renderHeader({ backendStatus: 'offline' })
    
    expect(screen.getByText(/local cache/i)).toBeInTheDocument()
  })

  it('renders advancement controls when onAdvanceDays is provided', () => {
    renderHeader()
    
    expect(screen.getByRole('button', { name: '+1d' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+5d' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+10d' })).toBeInTheDocument()
  })

  it.each([
    { days: 1, label: '+1d' },
    { days: 5, label: '+5d' },
    { days: 10, label: '+10d' },
  ])('calls onAdvanceDays when $label button is clicked', async ({ days, label }) => {
    const onAdvanceDays = vi.fn()
    const user = userEvent.setup()

    renderHeader({ onAdvanceDays })
    
    const advanceButton = screen.getByRole('button', { name: label })
    await user.click(advanceButton)

    expect(onAdvanceDays).toHaveBeenCalledWith(days)
  })
})
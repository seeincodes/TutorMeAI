import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock AuthContext
vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock fetch for dashboard data
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ students: [], apps: [], oauth_connections: [] }) })
))

import { useAuth } from '@/lib/AuthContext'

const mockUseAuth = vi.mocked(useAuth)

function renderWithRouter(initialRoute: string, role: string) {
  mockUseAuth.mockReturnValue({
    user: { id: '1', username: 'testuser', display_name: null, role, grade: null, allowed_levels: null },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })

  // Lazy import to avoid module caching issues
  return import('@/pages/dashboard/DashboardLayout').then(({ default: DashboardLayout }) => {
    render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <DashboardLayout />
      </MemoryRouter>
    )
  })
}

describe('DashboardLayout', () => {
  it('renders sidebar with ChatBridge brand', async () => {
    await renderWithRouter('/dashboard/students', 'admin')
    expect(screen.getByText('ChatBridge')).toBeInTheDocument()
  })

  it('renders Back to Chat link', async () => {
    await renderWithRouter('/dashboard/students', 'admin')
    expect(screen.getByText(/back to chat/i)).toBeInTheDocument()
  })

  it('shows Teaching section nav items for teachers', async () => {
    await renderWithRouter('/dashboard/students', 'teacher')
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('Apps')).toBeInTheDocument()
    expect(screen.getByText('Flags')).toBeInTheDocument()
  })

  it('hides Admin section nav items for teachers', async () => {
    await renderWithRouter('/dashboard/students', 'teacher')
    expect(screen.queryByText('Districts')).not.toBeInTheDocument()
    expect(screen.queryByText('Marketplace')).not.toBeInTheDocument()
    expect(screen.queryByText('App Health')).not.toBeInTheDocument()
    expect(screen.queryByText('Costs')).not.toBeInTheDocument()
  })

  it('shows only Admin section for admins (no Teaching)', async () => {
    await renderWithRouter('/dashboard/students', 'admin')
    // Teaching section hidden for admins
    expect(screen.queryByText('Students')).not.toBeInTheDocument()
    expect(screen.queryByText('Flags')).not.toBeInTheDocument()
    // Admin section visible
    expect(screen.getByText('Districts')).toBeInTheDocument()
    expect(screen.getByText('Marketplace')).toBeInTheDocument()
    expect(screen.getByText('App Health')).toBeInTheDocument()
    expect(screen.getByText('Costs')).toBeInTheDocument()
  })

  it('shows user info in footer', async () => {
    await renderWithRouter('/dashboard/students', 'admin')
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('shows sign out button', async () => {
    await renderWithRouter('/dashboard/students', 'admin')
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })
})

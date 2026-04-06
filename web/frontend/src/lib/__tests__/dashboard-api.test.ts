import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

function mockJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  }
}

describe('dashboard API client', () => {
  it('fetchDistricts calls GET /api/districts', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ id: '1', name: 'Test', state: 'CA' }]))

    const result = await api.fetchDistricts()

    expect(mockFetch).toHaveBeenCalledWith('/api/districts', expect.anything())
    expect(result).toEqual([{ id: '1', name: 'Test', state: 'CA' }])
  })

  it('approveDistrictApp calls POST /api/districts/:id/apps', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'chess', status: 'approved' }))

    const result = await api.approveDistrictApp('dist-1', 'chess')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/districts/dist-1/apps',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ app_id: 'chess' }),
      })
    )
    expect(result.status).toBe('approved')
  })

  it('revokeDistrictApp calls DELETE /api/districts/:id/apps/:appId', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ status: 'revoked' }))

    const result = await api.revokeDistrictApp('dist-1', 'chess')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/districts/dist-1/apps/chess',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(result.status).toBe('revoked')
  })

  it('fetchMarketplaceCatalog calls GET /api/marketplace/catalog', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ app_id: 'chess', trust_tier: 'verified' }]))

    const result = await api.fetchMarketplaceCatalog()

    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/catalog', expect.anything())
    expect(result[0].trust_tier).toBe('verified')
  })

  it('updateTrustTier calls PATCH /api/marketplace/:appId/trust', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'chess', trust_tier: 'district' }))

    const result = await api.updateTrustTier('chess', 'district')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/marketplace/chess/trust',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ trust_tier: 'district' }),
      })
    )
    expect(result.trust_tier).toBe('district')
  })

  it('fetchScreeningQueue calls GET /api/marketplace/screening-queue', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([]))

    await api.fetchScreeningQueue()

    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/screening-queue', expect.anything())
  })

  it('clearAppFlags calls POST /api/marketplace/:appId/clear-flags', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ flag_count: 0, is_active: true }))

    const result = await api.clearAppFlags('bad-app')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/marketplace/bad-app/clear-flags',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.flag_count).toBe(0)
  })

  it('fetchAppHealth calls GET /api/observability/app-health', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ app_id: 'chess', invocation_count: 10 }]))

    const result = await api.fetchAppHealth()

    expect(mockFetch).toHaveBeenCalledWith('/api/observability/app-health', expect.anything())
    expect(result[0].invocation_count).toBe(10)
  })

  it('fetchCostDashboard calls GET /api/observability/cost-dashboard', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ total_input_tokens: 1000, total_output_tokens: 500, per_app: [] }))

    const result = await api.fetchCostDashboard()

    expect(mockFetch).toHaveBeenCalledWith('/api/observability/cost-dashboard', expect.anything())
    expect(result.total_input_tokens).toBe(1000)
  })

  it('browseMarketplace calls GET /api/marketplace/browse', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ app_id: 'chess', name: 'Chess' }]))
    const result = await api.browseMarketplace()
    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/browse', expect.anything())
    expect(result[0].app_id).toBe('chess')
  })

  it('fetchAppDetail calls GET /api/marketplace/:appId/detail', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'chess', name: 'Chess', tool_schemas: [] }))
    const result = await api.fetchAppDetail('chess')
    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/chess/detail', expect.anything())
    expect(result.app_id).toBe('chess')
  })

  it('submitApp calls POST /api/marketplace/submit', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'new-app', status: 'pending_review' }, 201))
    const result = await api.submitApp({
      app_id: 'new-app', name: 'New App', description: 'Test',
      iframe_url: 'https://example.com', tool_schemas: [],
      developer_name: 'Dev', developer_email: 'dev@test.com',
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/submit', expect.objectContaining({ method: 'POST' }))
    expect(result.status).toBe('pending_review')
  })

  it('reviewApp calls POST /api/marketplace/:appId/review', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'chess', status: 'active' }))
    const result = await api.reviewApp('chess', 'approve')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/marketplace/chess/review',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ action: 'approve' }) })
    )
    expect(result.status).toBe('active')
  })

  it('listClassrooms calls GET /api/classrooms', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ id: '1', name: 'Math' }]))
    const result = await api.listClassrooms()
    expect(mockFetch).toHaveBeenCalledWith('/api/classrooms', expect.anything())
    expect(result[0].name).toBe('Math')
  })

  it('addAppToClassroom calls POST /api/classrooms/:id/apps', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ classroom_id: '1', app_id: 'chess' }, 201))
    const result = await api.addAppToClassroom('1', 'chess')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/classrooms/1/apps',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ app_id: 'chess' }) })
    )
    expect(result.app_id).toBe('chess')
  })

  it('fetchReviewQueue calls GET /api/marketplace/review-queue', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ app_id: 'test', status: 'pending_review' }]))
    const result = await api.fetchReviewQueue()
    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/review-queue', expect.anything())
    expect(result[0].status).toBe('pending_review')
  })
})

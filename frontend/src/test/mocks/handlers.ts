import { http, HttpResponse } from 'msw'

/**
 * MSW request handlers for WH40k Colony Manager API
 * Mirrors FastAPI endpoints from /api/v1/...
 */

// Mock colony data
export const mockColony = {
  id: 1,
  name: 'Hive Tarsus',
  colony_type: 'hive',
  founder_name: 'Lord Commander Tarsus',
  size: 5,
  complacency: 2,
  order: 4,
  productivity: 3,
  piety: 2,
  profit_factor: 2,
  age_in_cycles: 12,
  calculated_state: {
    order_state: 'stable',
    complacency_state: 'normal',
    productivity_state: 'productive',
    piety_state: 'normal',
  },
  modifiers: [
    {
      id: 1,
      source_type: 'infrastructure',
      source_id: 1,
      source_name: 'Power Network',
      stat: 'productivity',
      value: 2,
      is_working: true,
    },
  ],
}

export const mockColoniesList = {
  items: [
    mockColony,
    {
      id: 2,
      name: 'Forge World Alpha',
      colony_type: 'forge',
      founder_name: 'Arch-Magos Delatorre',
      size: 8,
      complacency: 3,
      order: 6,
      productivity: 7,
      piety: 4,
      profit_factor: 4,
      age_in_cycles: 24,
      calculated_state: {
        order_state: 'stable',
        complacency_state: 'normal',
        productivity_state: 'productive',
        piety_state: 'normal',
      },
      modifiers: [],
    },
  ],
  meta: {
    total: 2,
    offset: 0,
    limit: 20,
    has_more: false,
    total_pages: 1,
  },
}

export const handlers = [
  // GET /api/v1/colonies - List all colonies
  http.get('/api/v1/colonies', () => {
    return HttpResponse.json(mockColoniesList)
  }),

  // GET /api/v1/colonies/:id - Get single colony
  http.get('/api/v1/colonies/:id', ({ params }) => {
    const { id } = params
    if (id === '999') {
      return HttpResponse.json(
        { detail: 'Colony not found', status_code: 404 },
        { status: 404 }
      )
    }
    return HttpResponse.json(mockColony)
  }),

  // POST /api/v1/colonies - Create colony
  http.post('/api/v1/colonies', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        ...mockColony,
        id: Math.floor(Math.random() * 1000),
        name: (body as any).name || 'New Colony',
      },
      { status: 201 }
    )
  }),

  // PUT /api/v1/colonies/:id - Update colony
  http.put('/api/v1/colonies/:id', async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json({
      ...mockColony,
      id: Number(params.id),
      ...(body as any),
    })
  }),

  // DELETE /api/v1/colonies/:id - Delete colony
  http.delete('/api/v1/colonies/:id', ({ params }) => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/v1/colonies/:id/modifiers - Get colony modifiers
  http.get('/api/v1/colonies/:id/modifiers', () => {
    return HttpResponse.json({
      items: mockColony.modifiers,
    })
  }),

  // POST /api/v1/colonies/:id/modifiers - Add modifier
  http.post('/api/v1/colonies/:id/modifiers', async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: Math.floor(Math.random() * 1000),
        colony_id: Number(params.id),
        source: (body as any).modifier_source_type || 'custom',
        category: (body as any).modifier_category || 'custom',
        stat: (body as any).modifier_stat,
        value: (body as any).modifier_value,
        name: (body as any).modifier_description,
      },
      { status: 201 }
    )
  }),

  // DELETE /api/v1/colonies/:id/modifiers/:modifierId - Delete modifier
  http.delete('/api/v1/colonies/:colonyId/modifiers/:modifierId', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/v1/representatives - List representatives
  http.get('/api/v1/representatives', () => {
    return HttpResponse.json({
      items: [
        {
          id: 1,
          name: 'Inquisitor Malchus',
          type: 'inquisitor',
          colony_id: 1,
          personality_traits: ['judicious', 'ruthless'],
          stats: {
            ws: 3,
            bs: 4,
            s: 3,
            t: 4,
            ag: 3,
            int: 5,
            per: 4,
            wp: 5,
            fel: 3,
          },
        },
      ],
      meta: {
        total: 1,
        offset: 0,
        limit: 20,
        has_more: false,
        total_pages: 1,
      },
    })
  }),

  // POST /api/v1/auth/login - Login
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json()
    const { username, password } = body as { username: string; password: string }
    
    if (username === 'admin' && password === 'password') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token-12345',
        token_type: 'bearer',
      })
    }
    
    return HttpResponse.json(
      { detail: 'Incorrect username or password', status_code: 401 },
      { status: 401 }
    )
  }),
]
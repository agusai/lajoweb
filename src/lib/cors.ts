export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function corsResponse(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init.headers ?? {}) },
  })
}

export function corsError(message: string, status = 500) {
  return corsResponse({ status: 'error', message }, { status })
}

export function corsOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
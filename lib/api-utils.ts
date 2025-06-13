/**
 * Utility functions for API routes
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
  warning?: string
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(data: T, warning?: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }

  if (warning) {
    response.warning = warning
  }

  return Response.json(response)
}

/**
 * Creates an error API response
 */
export function errorResponse(message: string, details?: string, status = 500): Response {
  return Response.json(
    {
      success: false,
      error: message,
      details: details || "No additional details provided",
    },
    { status },
  )
}

/**
 * Safely handles API requests with proper error handling
 */
export async function safeApiHandler<T>(
  handler: () => Promise<T>,
  errorMessage = "An error occurred",
): Promise<Response> {
  try {
    const result = await handler()
    return successResponse(result)
  } catch (error) {
    console.error(`API Error: ${errorMessage}`, error)
    return errorResponse(errorMessage, error instanceof Error ? error.message : "Unknown error")
  }
}

/**
 * Validates request content type
 */
export function validateContentType(request: Request, contentType: string): boolean {
  return request.headers.get("content-type")?.includes(contentType) || false
}

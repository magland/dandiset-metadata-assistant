import { validateMetadata, formatValidationErrors } from './validation';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://magland.github.io',
];

// DANDI API base URL
const DANDI_API_BASE = 'https://api.dandiarchive.org/api';

/**
 * Request body interface for commit endpoint
 */
interface CommitRequest {
  dandisetId: string;
  version: string;
  metadata: any;
  apiKey: string;
}

/**
 * Request body interface for publish endpoint
 */
interface PublishRequest {
  dandisetId: string;
  apiKey: string;
}

/**
 * Handle CORS preflight requests
 */
function handleCors(request: Request): Response | null {
  const origin = request.headers.get('Origin');
  
  // Check if origin is allowed
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new Response('Origin not allowed', { status: 403 });
  }
  
  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  return null;
}

/**
 * Create CORS headers for response
 */
function getCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Handle commit metadata request
 */
async function handleCommit(request: Request): Promise<Response> {
  const origin = request.headers.get('Origin');
  
  // Validate origin
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Parse request body
    const body: CommitRequest = await request.json();
    const { dandisetId, version, metadata, apiKey } = body;
    
    // Validate required fields
    if (!dandisetId || !version || !metadata || !apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: dandisetId, version, metadata, apiKey' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Validate version format (must be 'draft' or version pattern)
    const versionPattern = /^((0\.\d{6}\.\d{4})|draft)$/;
    if (!versionPattern.test(version)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid version format. Must be "draft" or match pattern "0.XXXXXX.XXXX"' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Validate metadata against JSON schema
    const validationResult = await validateMetadata(metadata);
    
    if (!validationResult.valid) {
      const errorMessage = formatValidationErrors(validationResult.errors);
      
      return new Response(
        JSON.stringify({ 
          error: 'Metadata validation failed',
          validationErrors: validationResult.errors,
          message: errorMessage,
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Forward to DANDI API
    const dandiUrl = `${DANDI_API_BASE}/dandisets/${dandisetId}/versions/${version}/`;
    
    const dandiResponse = await fetch(dandiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: metadata,
        name: metadata.name,
      }),
    });
    
    // Get response body
    const responseText = await dandiResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }
    
    // Check if DANDI request was successful
    if (!dandiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'DANDI API request failed',
          status: dandiResponse.status,
          message: responseData.message || responseData.detail || responseText,
          details: responseData,
        }),
        { 
          status: dandiResponse.status, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    console.log(`Successfully committed metadata to DANDI`);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Metadata committed successfully',
        data: responseData,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
    
  } catch (error) {
    console.error('Error handling commit request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}

/**
 * Handle publish dandiset request
 */
async function handlePublish(request: Request): Promise<Response> {
  const origin = request.headers.get('Origin');
  
  // Validate origin
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Parse request body
    const body: PublishRequest = await request.json();
    const { dandisetId, apiKey } = body;
    
    // Validate required fields
    if (!dandisetId || !apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: dandisetId, apiKey'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // Forward to DANDI API publish endpoint
    const dandiUrl = `${DANDI_API_BASE}/dandisets/${dandisetId}/versions/draft/publish/`;
    
    const dandiResponse = await fetch(dandiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Get response body
    const responseText = await dandiResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }
    
    // Check if DANDI request was successful
    if (!dandiResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'DANDI API publish request failed',
          status: dandiResponse.status,
          message: responseData.message || responseData.detail || responseText,
          details: responseData,
        }),
        {
          status: dandiResponse.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    console.log(`Successfully published dandiset ${dandisetId}`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dandiset published successfully',
        data: responseData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
    
  } catch (error) {
    console.error('Error handling publish request:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}

/**
 * Main Worker export
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    const corsResponse = handleCors(request);
    if (corsResponse) {
      return corsResponse;
    }
    
    // Route to commit endpoint
    if (url.pathname === '/commit' && request.method === 'POST') {
      return handleCommit(request);
    }
    
    // Route to publish endpoint
    if (url.pathname === '/publish' && request.method === 'POST') {
      return handlePublish(request);
    }
    
    // Health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({ 
          status: 'ok',
          service: 'dandiset-metadata-proxy',
          version: '1.0.0',
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  },
};

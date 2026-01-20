import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensures the API is not cached

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');

  // Verify the request comes from your authorized GitHub Action
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Add your job scraping or database sync logic here
    console.log("Job sync triggered successfully");
    
    return NextResponse.json({ 
      message: 'Job sync started', 
      timestamp: new Date().toISOString() 
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
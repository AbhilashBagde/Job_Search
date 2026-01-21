import { NextResponse } from 'next/server';
import { syncJobsAction } from '@/app/actions/sync-jobs';

export const dynamic = 'force-dynamic'; 

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');

  // Verify the secret key from GitHub Actions
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("Job sync triggered...");
    
    // CALL THE REAL ACTION HERE
    const result = await syncJobsAction();
    
    return NextResponse.json({ 
      message: 'Job sync completed', 
      new_jobs: result.newJobsAdded,
      timestamp: new Date().toISOString() 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sync failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// 1. Use the modern Deno.serve syntax
Deno.serve(async (req) => {
  // 2. Handle Method Not Allowed
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { status: 405, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    // Security check: Ensure API key exists
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable")
    }

    // 3. Parse the incoming request (Webhook data from Supabase)
    const { record } = await req.json() 

    // 4. Send the email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'JobMachine <onboarding@resend.dev>',
        to: ['bagde.abhilash77@gmail.com'], 
        subject: '🚀 New H1B Job Found!',
        html: `
          <strong>Action Required:</strong> 
          <p>We found a new role: <b>${record.title}</b> at <b>${record.company}</b>.</p>
          <p>Location: ${record.location}</p>
          <p>Check your dashboard to apply!</p>
        `,
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify({ message: "Email sent successfully", data }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
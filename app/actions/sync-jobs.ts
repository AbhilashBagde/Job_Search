"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyJobWithGemini } from "./verify-job";

// Simulated Scraper: In a real-world scenario, this would call a Job Search API 
// like SerpApi (Google Jobs), LinkedIn Scraper, or Adzuna.
async function simulateScraper() {
  console.log("Starting job search for 'Data Engineer OR Data Scientist OR Business Analyst'...");
  
  // Mocking diverse results from a "search"
  return [
    {
      company_name: "Airbnb",
      job_title: "Data Scientist, Analytics",
      job_link: "https://careers.airbnb.com/jobs/ds-1",
      location: "Remote, US",
      salary_range: "$160k - $210k",
      description: "Join our analytics team to drive product decisions. Strong SQL and Python skills required. Experience with experimentation is a plus."
    },
    {
      company_name: "DoorDash",
      job_title: "Machine Learning Engineer",
      job_link: "https://careers.doordash.com/jobs/mle-2",
      location: "San Francisco, CA",
      salary_range: "$170k - $230k",
      description: "Build and deploy ML models for logistics optimization. Knowledge of Spark and PyTorch."
    },
    {
      company_name: "Snowflake",
      job_title: "Data Engineer",
      job_link: "https://snowflake.com/jobs/de-3",
      location: "Bellevue, WA",
      salary_range: "$150k - $190k",
      description: "Design and implement scalable data pipelines. Expert in SQL and cloud data warehousing."
    },
    {
      company_name: "Microsoft", // Should be filtered by Gemini (FAANG check)
      job_title: "Senior Data Analyst",
      job_link: "https://careers.microsoft.com/jobs/da-4",
      location: "Redmond, WA",
      salary_range: "$140k - $180k",
      description: "Analyze user behavior for Azure services."
    },
    {
      company_name: "Plaid",
      job_title: "Business Analyst",
      job_link: "https://plaid.com/jobs/ba-5",
      location: "New York, NY",
      salary_range: "$110k - $150k",
      description: "Help us scale our financial infrastructure. Strong analytical mindset and Excel/SQL skills."
    }
  ];
}

async function sendEmailNotification(count: number) {
  // In a real app, use Resend, SendGrid, or Postmark here.
  // Example: await resend.emails.send({ to: 'user@example.com', subject: '...', html: '...' });
  console.log(`[EMAIL NOTIFICATION] Sent: ${count} New H1B Verified Leads Ready.`);
}

export async function syncJobsAction() {
  const supabase = await createClient();
  const scrapedJobs = await simulateScraper();
  let newJobsCount = 0;

  for (const job of scrapedJobs) {
    // 1. Check if job already exists
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('job_link', job.job_link)
      .single();

    if (existing) continue;

    // 2. Verify with Gemini (Anti-FAANG + H1B Check)
    const verification = await verifyJobWithGemini(
      job.company_name,
      job.job_title,
      job.description
    );

    // 3. Save if eligible
    if (verification.is_eligible) {
      const { error } = await supabase.from('jobs').insert({
        company_name: job.company_name,
        job_title: job.job_title,
        job_link: job.job_link,
        location: job.location,
        salary_range: job.salary_range,
        category: verification.category,
        sponsorship_proof: verification.sponsorship_proof,
      });

      if (!error) newJobsCount++;
    }
  }

  // 4. Check for notification trigger (10 new unapplied jobs)
  const { count: unappliedCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_applied', false);

  // Trigger notification if we have 10 or more unapplied jobs
  // In a real scenario, you might track if you've already sent a notification for these specific 10
  if (unappliedCount && unappliedCount >= 10) {
    await sendEmailNotification(unappliedCount);
  }

  return { success: true, newJobsAdded: newJobsCount };
}

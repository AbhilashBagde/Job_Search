"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyJobWithGemini } from "./verify-job";

// Simulated Scraper
async function simulateScraper() {
  console.log("Starting job search...");
  return [
    {
      company_name: "Airbnb",
      job_title: "Data Scientist, Analytics",
      job_link: "https://careers.airbnb.com/jobs/ds-1",
      location: "Remote, US",
      salary_range: "$160k - $210k",
      description: "Join our analytics team to drive product decisions. Strong SQL and Python skills required."
    },
    {
      company_name: "DoorDash",
      job_title: "Machine Learning Engineer",
      job_link: "https://careers.doordash.com/jobs/mle-2",
      location: "San Francisco, CA",
      salary_range: "$170k - $230k",
      description: "Build and deploy ML models for logistics optimization."
    },
    {
      company_name: "Snowflake",
      job_title: "Data Engineer",
      job_link: "https://snowflake.com/jobs/de-3",
      location: "Bellevue, WA",
      salary_range: "$150k - $190k",
      description: "Design and implement scalable data pipelines."
    }
  ];
}

export async function syncJobsAction() {
  const supabase = await createClient();
  const scrapedJobs = await simulateScraper();
  let newJobsCount = 0;

  for (const job of scrapedJobs) {
    // 1. Check if job already exists (using 'leads' table and 'link' column)
    const { data: existing } = await supabase
      .from('leads') 
      .select('id')
      .eq('link', job.job_link)
      .single();

    if (existing) continue;

    // 2. Verify with Gemini
    const verification = await verifyJobWithGemini(
      job.company_name,
      job.job_title,
      job.description
    );

    // 3. Save if eligible (Mapping variables to YOUR 'leads' table columns)
    if (verification.is_eligible) {
      const { error } = await supabase.from('leads').insert({
        company: job.company_name,          // matches 'company' column
        title: job.job_title,               // matches 'title' column
        link: job.job_link,                 // matches 'link' column
        location: job.location,             // matches 'location' column
        salary: job.salary_range,           // matches 'salary' column
        sponsorship_evidence: verification.sponsorship_proof, // matches 'sponsorship_evidence'
        // 'is_applied' defaults to false automatically
      });

      if (error) {
        console.error("Error inserting job:", error);
      } else {
        newJobsCount++;
      }
    }
  }

  return { success: true, newJobsAdded: newJobsCount };
}

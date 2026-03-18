import { fetchMentalHealthPMJobs } from "./jsearchApi";
import { bulkInsertJobs } from "./jobsDb";
import type { InsertJob } from "../drizzle/schema";

/**
 * Transform JSearch API result to our database schema
 * (Same logic as in jobsRouter.ts)
 */
function transformJobData(apiJob: any): InsertJob {
  const location = [apiJob.job_city, apiJob.job_state, apiJob.job_country]
    .filter(Boolean)
    .join(", ");

  const mentalHealthKeywords = ["mental health", "behavioral health", "therapy", "counseling"];
  const isDirectMentalHealth = mentalHealthKeywords.some(
    (keyword) =>
      apiJob.employer_name?.toLowerCase().includes(keyword) ||
      apiJob.job_title?.toLowerCase().includes(keyword) ||
      apiJob.job_description?.toLowerCase().includes(keyword)
  );

  const category = isDirectMentalHealth ? "Mental Health Tech" : "Mental Health Adjacent";

  return {
    externalId: apiJob.job_id,
    title: apiJob.job_title,
    company: apiJob.employer_name,
    location: location || null,
    locationType: apiJob.job_employment_type || null,
    posted: apiJob.job_posted_at_timestamp
      ? new Date(apiJob.job_posted_at_timestamp * 1000)
      : null,
    postedAgo: apiJob.job_posted_at_datetime_utc
      ? getTimeAgo(new Date(apiJob.job_posted_at_datetime_utc))
      : null,
    salaryMin: apiJob.job_min_salary || null,
    salaryMax: apiJob.job_max_salary || null,
    salaryCurrency: apiJob.job_salary_currency || "USD",
    salaryPeriod: apiJob.job_salary_period || "year",
    industry: "Mental Health Care",
    category,
    employmentType: apiJob.job_employment_type || null,
    experienceLevel: getExperienceLevel(apiJob.job_title),
    experienceYears: apiJob.job_required_experience?.required_experience_in_months
      ? `${Math.floor(apiJob.job_required_experience.required_experience_in_months / 12)}+`
      : null,
    description: apiJob.job_description || "",
    keyResponsibilities: apiJob.job_highlights?.Responsibilities || [],
    requirements: apiJob.job_highlights?.Qualifications || [],
    benefits: apiJob.job_highlights?.Benefits || [],
    url: apiJob.job_apply_link,
    isActive: 1,
  };
}

function getExperienceLevel(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("lead")) {
    return "Senior level";
  }
  if (titleLower.includes("junior") || titleLower.includes("jr.") || titleLower.includes("associate")) {
    return "Entry level";
  }
  if (titleLower.includes("director") || titleLower.includes("vp") || titleLower.includes("head of")) {
    return "Director level";
  }
  return "Mid-Senior level";
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} months ago`;
  }
}

/**
 * Fetch and save mental health PM jobs from JSearch API
 * This function is called by the scheduler
 */
export async function fetchAndSaveJobsScheduled(): Promise<{
  success: boolean;
  message: string;
  count: number;
  error?: string;
}> {
  const timestamp = new Date().toISOString();
  console.log(`[Scheduled Job Fetch] Starting at ${timestamp}`);

  try {
    // Fetch jobs from JSearch API
    const apiJobs = await fetchMentalHealthPMJobs();

    if (apiJobs.length === 0) {
      const message = `[Scheduled Job Fetch] No new jobs found at ${timestamp}`;
      console.log(message);
      return {
        success: true,
        message,
        count: 0,
      };
    }

    // Transform and save to database
    const transformedJobs = apiJobs.map(transformJobData);
    await bulkInsertJobs(transformedJobs);

    const message = `[Scheduled Job Fetch] Successfully fetched and saved ${transformedJobs.length} jobs at ${timestamp}`;
    console.log(message);

    return {
      success: true,
      message,
      count: transformedJobs.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const message = `[Scheduled Job Fetch] Failed at ${timestamp}: ${errorMessage}`;
    console.error(message);

    return {
      success: false,
      message,
      count: 0,
      error: errorMessage,
    };
  }
}

/**
 * Initialize scheduled job fetching
 * Runs immediately on startup and then at the specified interval
 */
export function initializeScheduledJobFetching(intervalHours: number = 24): NodeJS.Timeout {
  // Run immediately on startup
  fetchAndSaveJobsScheduled().catch((error) => {
    console.error("[Scheduled Job Fetch] Startup fetch failed:", error);
  });

  // Schedule recurring fetch
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const timeout = setInterval(() => {
    fetchAndSaveJobsScheduled().catch((error) => {
      console.error("[Scheduled Job Fetch] Recurring fetch failed:", error);
    });
  }, intervalMs);

  console.log(`[Scheduled Job Fetch] Initialized with ${intervalHours} hour interval`);

  return timeout;
}

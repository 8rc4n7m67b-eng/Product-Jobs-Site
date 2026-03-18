import { TRPCError } from "@trpc/server";
import { InsertJob } from "../drizzle/schema";
import { getAllActiveJobs, bulkInsertJobs } from "./jobsDb";
import { fetchMentalHealthPMJobs } from "./jsearchApi";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

/**
 * Transform JSearch API result to our database schema
 */
function transformJobData(apiJob: any): InsertJob {
  const location = [apiJob.job_city, apiJob.job_state, apiJob.job_country]
    .filter(Boolean)
    .join(", ");

  // Determine category based on employer or job title keywords
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

/**
 * Get experience level from job title
 */
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

/**
 * Calculate time ago from a date
 */
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

export const jobsRouter = router({
  /**
   * Get all active jobs from database
   * Public access - no authentication required to view jobs
   */
  list: publicProcedure.query(async () => {
    try {
      const jobs = await getAllActiveJobs();
      return jobs;
    } catch (error) {
      console.error("[Jobs Router] Failed to fetch jobs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch jobs from database",
      });
    }
  }),

  /**
   * Fetch fresh jobs from JSearch API and save to database
   * This should be called periodically (e.g., daily) to update the job listings
   */
  fetchAndSave: protectedProcedure.mutation(async ({ ctx }) => {
    // Only allow admin users to trigger job fetching
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can fetch new jobs",
      });
    }

    try {
      // Fetch jobs from JSearch API
      const apiJobs = await fetchMentalHealthPMJobs();

      if (apiJobs.length === 0) {
        return {
          success: true,
          message: "No new jobs found",
          count: 0,
        };
      }

      // Transform and save to database
      const transformedJobs = apiJobs.map(transformJobData);
      await bulkInsertJobs(transformedJobs);

      return {
        success: true,
        message: `Successfully fetched and saved ${transformedJobs.length} jobs`,
        count: transformedJobs.length,
      };
    } catch (error) {
      console.error("[Jobs Router] Failed to fetch and save jobs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch jobs from API",
      });
    }
  }),
});

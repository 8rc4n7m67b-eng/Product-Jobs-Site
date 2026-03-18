import axios from "axios";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

interface JSearchJobResult {
  job_id: string;
  employer_name: string;
  employer_logo?: string;
  job_title: string;
  job_description: string;
  job_apply_link: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_posted_at_datetime_utc?: string;
  job_posted_at_timestamp?: number;
  job_employment_type?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_salary_period?: string;
  job_required_experience?: {
    required_experience_in_months?: number;
  };
  job_highlights?: {
    Responsibilities?: string[];
    Qualifications?: string[];
    Benefits?: string[];
  };
}

interface JSearchResponse {
  status: string;
  request_id: string;
  data: JSearchJobResult[];
}

/**
 * Search for jobs using JSearch API
 * @param query Search query (e.g., "product manager mental health")
 * @param page Page number (default: 1)
 * @param numPages Number of pages to fetch (default: 1)
 */
export async function searchJobs(
  query: string,
  page: number = 1,
  numPages: number = 1
): Promise<JSearchJobResult[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY is not configured");
  }

  try {
    const response = await axios.get<JSearchResponse>(
      "https://jsearch.p.rapidapi.com/search",
      {
        params: {
          query,
          page: page.toString(),
          num_pages: numPages.toString(),
          date_posted: "month", // Only jobs from last month
        },
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
        timeout: 30000,
      }
    );

    if (response.data.status === "OK") {
      return response.data.data || [];
    } else {
      console.error("[JSearch API] Error response:", response.data);
      return [];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[JSearch API] Request failed:", error.message);
      if (error.response) {
        console.error("[JSearch API] Response:", error.response.data);
      }
    } else {
      console.error("[JSearch API] Unexpected error:", error);
    }
    throw error;
  }
}

/**
 * Fetch mental health product management jobs
 */
export async function fetchMentalHealthPMJobs(): Promise<JSearchJobResult[]> {
  const queries = [
    "product manager mental health",
    "product manager telehealth",
    "product manager behavioral health",
  ];

  const allJobs: JSearchJobResult[] = [];

  for (const query of queries) {
    try {
      const jobs = await searchJobs(query, 1, 1);
      allJobs.push(...jobs);
    } catch (error) {
      console.error(`[JSearch API] Failed to fetch jobs for query "${query}":`, error);
    }
  }

  // Deduplicate by job_id
  const uniqueJobs = Array.from(
    new Map(allJobs.map((job) => [job.job_id, job])).values()
  );

  return uniqueJobs;
}

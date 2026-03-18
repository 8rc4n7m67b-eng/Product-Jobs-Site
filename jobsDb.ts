import { desc, eq } from "drizzle-orm";
import { InsertJob, jobs } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get all active jobs, ordered by most recently posted
 */
export async function getAllActiveJobs() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get jobs: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.isActive, 1))
    .orderBy(desc(jobs.posted));

  return result;
}

/**
 * Insert or update a job by externalId
 */
export async function upsertJob(job: InsertJob): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert job: database not available");
    return;
  }

  try {
    await db.insert(jobs).values(job).onDuplicateKeyUpdate({
      set: {
        title: job.title,
        company: job.company,
        location: job.location,
        locationType: job.locationType,
        posted: job.posted,
        postedAgo: job.postedAgo,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        salaryPeriod: job.salaryPeriod,
        industry: job.industry,
        category: job.category,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        experienceYears: job.experienceYears,
        description: job.description,
        keyResponsibilities: job.keyResponsibilities,
        requirements: job.requirements,
        benefits: job.benefits,
        url: job.url,
        isActive: job.isActive ?? 1,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert job:", error);
    throw error;
  }
}

/**
 * Bulk insert jobs
 */
export async function bulkInsertJobs(jobsList: InsertJob[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot bulk insert jobs: database not available");
    return;
  }

  if (jobsList.length === 0) return;

  try {
    for (const job of jobsList) {
      await upsertJob(job);
    }
  } catch (error) {
    console.error("[Database] Failed to bulk insert jobs:", error);
    throw error;
  }
}

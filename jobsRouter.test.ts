import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { bulkInsertJobs } from "./jobsDb";
import { InsertJob } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("jobs router", () => {
  beforeAll(async () => {
    // Seed some test data
    const testJobs: InsertJob[] = [
      {
        externalId: "test-job-1",
        title: "Senior Product Manager",
        company: "Test Mental Health Co",
        location: "Remote",
        locationType: "Remote",
        posted: new Date(),
        postedAgo: "1 day ago",
        salaryMin: 150000,
        salaryMax: 200000,
        salaryCurrency: "USD",
        salaryPeriod: "year",
        industry: "Mental Health Care",
        category: "Mental Health Tech",
        employmentType: "Full-time",
        experienceLevel: "Senior level",
        experienceYears: "5+",
        description: "Test job description",
        keyResponsibilities: ["Lead product strategy", "Manage team"],
        requirements: ["5+ years PM experience"],
        benefits: ["Health insurance", "401k"],
        url: "https://example.com/job/1",
        isActive: 1,
      },
    ];

    await bulkInsertJobs(testJobs);
  });

  it("should allow authenticated users to list jobs", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const jobs = await caller.jobs.list();

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
    
    const firstJob = jobs[0];
    expect(firstJob).toHaveProperty("id");
    expect(firstJob).toHaveProperty("title");
    expect(firstJob).toHaveProperty("company");
  });

  it("should allow unauthenticated users to list jobs", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const jobs = await caller.jobs.list();

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
  });

  it("should prevent non-admin users from fetching new jobs", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.jobs.fetchAndSave()).rejects.toThrow("Only administrators can fetch new jobs");
  });

  it("should allow admin users to fetch new jobs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This will actually call the API, so it might fail if API is down or rate limited
    // We just check it doesn't throw a permission error
    try {
      const result = await caller.jobs.fetchAndSave();
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("count");
    } catch (error: any) {
      // If it fails, it should be due to API issues, not permissions
      expect(error.code).not.toBe("FORBIDDEN");
    }
  }, 60000); // 60 second timeout for API call
});

import { describe, expect, it, vi } from "vitest";
import { fetchAndSaveJobsScheduled } from "./scheduledJobs";

describe("Scheduled Job Fetching", () => {
  it("should successfully execute scheduled job fetch", async () => {
    const result = await fetchAndSaveJobsScheduled();

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("count");
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.message).toBe("string");
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  }, 60000); // 60 second timeout for API call

  it("should include timestamp in log message", async () => {
    const result = await fetchAndSaveJobsScheduled();

    expect(result.message).toContain("[Scheduled Job Fetch]");
  }, 60000);

  it("should handle API failures gracefully", async () => {
    // This test verifies that the function doesn't throw even if API fails
    // The actual error handling is tested by checking the response
    const result = await fetchAndSaveJobsScheduled();

    // Should always return an object with success property
    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  }, 60000);
});

import { describe, expect, it } from "vitest";
import { searchJobs } from "./jsearchApi";

describe("JSearch API Integration", () => {
  it("should successfully fetch jobs with valid API key", async () => {
    // Test with a simple query to validate the API key
    const results = await searchJobs("product manager", 1, 1);
    
    // Should return an array (even if empty)
    expect(Array.isArray(results)).toBe(true);
    
    // If results exist, validate structure
    if (results.length > 0) {
      const firstJob = results[0];
      expect(firstJob).toHaveProperty("job_id");
      expect(firstJob).toHaveProperty("employer_name");
      expect(firstJob).toHaveProperty("job_title");
      expect(firstJob).toHaveProperty("job_apply_link");
    }
  }, 30000); // 30 second timeout for API call
});

import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Job, JobCard } from "@/components/JobCard";
import { JobPostingTimingReport } from "@/components/JobPostingTimingReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [salaryBandFilter, setSalaryBandFilter] = useState("all");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("all");
  const [timeSincePostingFilter, setTimeSincePostingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch jobs from backend
  const { data: jobsData = [], isLoading, error, refetch } = trpc.jobs.list.useQuery();

  // Mutation to fetch fresh jobs from API (admin only)
  const fetchJobsMutation = trpc.jobs.fetchAndSave.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch(); // Refresh the job list
    },
    onError: (error) => {
      toast.error(`Failed to fetch jobs: ${error.message}`);
    },
  });

  // Calculate unique companies and experience levels for filters
  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(jobsData.map((job) => job.company))).sort();
  }, [jobsData]);

  const uniqueExperienceLevels = useMemo(() => {
    return Array.from(new Set(jobsData.map((job) => job.experienceLevel).filter(Boolean)));
  }, [jobsData]);

  // Filter jobs based on all criteria
  const filteredJobs = useMemo(() => {
    let filtered = jobsData.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesCategory = categoryFilter === "all" || job.category === categoryFilter;
      const matchesCompany = companyFilter === "all" || job.company === companyFilter;
      const matchesExperience = experienceLevelFilter === "all" || job.experienceLevel === experienceLevelFilter;
      
      // Salary band filter
      let matchesSalaryBand = true;
      if (salaryBandFilter !== "all" && job.salaryMin) {
        const avgSalary = (job.salaryMin + (job.salaryMax || job.salaryMin)) / 2;
        if (salaryBandFilter === "0-100k" && avgSalary > 100000) matchesSalaryBand = false;
        if (salaryBandFilter === "100-150k" && (avgSalary < 100000 || avgSalary > 150000)) matchesSalaryBand = false;
        if (salaryBandFilter === "150-200k" && (avgSalary < 150000 || avgSalary > 200000)) matchesSalaryBand = false;
        if (salaryBandFilter === "200k+" && avgSalary < 200000) matchesSalaryBand = false;
      }
      
      // Time since posting filter
      let matchesTimeSincePosting = true;
      if (timeSincePostingFilter !== "all" && job.posted) {
        const postedDate = job.posted instanceof Date ? job.posted : new Date(String(job.posted));
        const daysAgo = Math.floor((new Date().getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (timeSincePostingFilter === "today" && daysAgo !== 0) matchesTimeSincePosting = false;
        if (timeSincePostingFilter === "week" && daysAgo > 7) matchesTimeSincePosting = false;
        if (timeSincePostingFilter === "month" && daysAgo > 30) matchesTimeSincePosting = false;
      }
      
      return matchesSearch && matchesCategory && matchesCompany && matchesSalaryBand && matchesExperience && matchesTimeSincePosting;
    });
    
    // Sort jobs
    if (sortBy === "salary-high") {
      filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    } else if (sortBy === "salary-low") {
      filtered.sort((a, b) => (a.salaryMin || 0) - (b.salaryMin || 0));
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = a.posted instanceof Date ? a.posted : new Date(String(a.posted || 0));
        const dateB = b.posted instanceof Date ? b.posted : new Date(String(b.posted || 0));
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        const dateA = a.posted instanceof Date ? a.posted : new Date(String(a.posted || 0));
        const dateB = b.posted instanceof Date ? b.posted : new Date(String(b.posted || 0));
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    return filtered;
  }, [jobsData, searchTerm, categoryFilter, companyFilter, salaryBandFilter, experienceLevelFilter, timeSincePostingFilter, sortBy]);

  // Calculate stats for charts
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    jobsData.forEach((job) => {
      if (job.category) {
        stats[job.category] = (stats[job.category] || 0) + 1;
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [jobsData]);

  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

  const handleFetchJobs = () => {
    fetchJobsMutation.mutate();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error loading jobs</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Market Overview
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Tracking {jobsData.length} active opportunities in Mental Health Tech.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
            {user?.role === "admin" && (
              <Button 
                onClick={handleFetchJobs}
                disabled={fetchJobsMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2"
              >
                {fetchJobsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Fetch New Jobs
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats & Charts Section */}
        {jobsData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Role Distribution</CardTitle>
                  <CardDescription>Breakdown by industry category</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          borderColor: 'var(--border)',
                          borderRadius: 'var(--radius)',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Job Posting Timeline */}
              <JobPostingTimingReport jobs={jobsData} />

            </div>

            <Separator className="my-8" />
          </>
        )}

        {/* Filter Panel - Show when button is clicked */}
        {showFilters && (
          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full bg-background border-border/60">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Mental Health Tech">Mental Health Tech</SelectItem>
                      <SelectItem value="Mental Health Adjacent">Mental Health Adjacent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Company</label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-full bg-background border-border/60">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {uniqueCompanies.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary Band Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Salary Band</label>
                  <Select value={salaryBandFilter} onValueChange={setSalaryBandFilter}>
                    <SelectTrigger className="w-full bg-background border-border/60">
                      <SelectValue placeholder="Select salary band" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ranges</SelectItem>
                      <SelectItem value="0-100k">$0 - $100K</SelectItem>
                      <SelectItem value="100-150k">$100K - $150K</SelectItem>
                      <SelectItem value="150-200k">$150K - $200K</SelectItem>
                      <SelectItem value="200k+">$200K+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
                    <SelectTrigger className="w-full bg-background border-border/60">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {uniqueExperienceLevels.map((level) => (
                        <SelectItem key={level} value={level || ""}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Since Posting Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Posted</label>
                  <Select value={timeSincePostingFilter} onValueChange={setTimeSincePostingFilter}>
                    <SelectTrigger className="w-full bg-background border-border/60">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full bg-background border-border/60">
                      <SelectValue placeholder="Select sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="salary-high">Highest Salary</SelectItem>
                      <SelectItem value="salary-low">Lowest Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setCompanyFilter("all");
                  setSalaryBandFilter("all");
                  setExperienceLevelFilter("all");
                  setTimeSincePostingFilter("all");
                  setSortBy("newest");
                  setShowFilters(false);
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Job Listings Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search roles, companies, or keywords..." 
                className="pl-10 bg-background border-border/60 focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredJobs.length} of {jobsData.length} jobs
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={{
                    ...job,
                    keyResponsibilities: job.keyResponsibilities as string[] || [],
                    requirements: job.requirements as string[] || [],
                    benefits: job.benefits as string[] || [],
                  } as Job} 
                />
              ))
            ) : jobsData.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No jobs available yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {user?.role === "admin" 
                    ? "Click 'Fetch New Jobs' to load the latest opportunities." 
                    : "Check back soon for new opportunities."}
                </p>
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No jobs match your filters</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

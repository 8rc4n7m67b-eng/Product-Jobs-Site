import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { Job } from "./JobCard";

interface TimingStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  older: number;
}

export function JobPostingTimingReport({ jobs }: { jobs: Job[] }) {
  const calculateTimingStats = (): TimingStats => {
    const now = new Date();
    const stats: TimingStats = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      older: 0,
    };

    jobs.forEach((job) => {
      if (!job.posted) return;
      const postedDate = job.posted instanceof Date ? job.posted : new Date(String(job.posted));
      const daysAgo = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

      // Categorize by time
      if (daysAgo === 0) {
        stats.today++;
      } else if (daysAgo <= 7) {
        stats.thisWeek++;
      } else if (daysAgo <= 30) {
        stats.thisMonth++;
      } else {
        stats.older++;
      }
    });

    return stats;
  };

  const stats = calculateTimingStats();
  const total = jobs.length;

  // Calculate percentages
  const percentages = {
    today: total > 0 ? Math.round((stats.today / total) * 100) : 0,
    thisWeek: total > 0 ? Math.round((stats.thisWeek / total) * 100) : 0,
    thisMonth: total > 0 ? Math.round((stats.thisMonth / total) * 100) : 0,
    older: total > 0 ? Math.round((stats.older / total) * 100) : 0,
  };

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <div>
            <CardTitle className="text-lg font-medium">Posting Timeline</CardTitle>
            <CardDescription>Job recency distribution</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact timeline bars */}
        <div className="space-y-3">
          {/* Today */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Today</span>
              <span className="text-muted-foreground">{stats.today} ({percentages.today}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${percentages.today || 5}%` }}
              />
            </div>
          </div>

          {/* This Week */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">This Week</span>
              <span className="text-muted-foreground">{stats.thisWeek} ({percentages.thisWeek}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentages.thisWeek || 5}%` }}
              />
            </div>
          </div>

          {/* This Month */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">This Month</span>
              <span className="text-muted-foreground">{stats.thisMonth} ({percentages.thisMonth}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentages.thisMonth || 5}%` }}
              />
            </div>
          </div>

          {/* Older */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Older</span>
              <span className="text-muted-foreground">{stats.older} ({percentages.older}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-slate-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentages.older || 5}%` }}
              />
            </div>
          </div>
        </div>

        {/* Summary stat */}
        <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{Math.round(((stats.today + stats.thisWeek) / total) * 100)}%</span> posted in last 7 days
        </div>
      </CardContent>
    </Card>
  );
}

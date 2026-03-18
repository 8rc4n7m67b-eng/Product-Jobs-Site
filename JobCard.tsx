import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, Calendar, MapPin, TrendingUp } from "lucide-react";
import { useState } from "react";

export interface Job {
  id: number;
  externalId: string | null;
  title: string;
  company: string;
  location: string | null;
  locationType: string | null;
  posted: Date | null;
  postedAgo: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  industry: string | null;
  category: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  experienceYears: string | null;
  description: string | null;
  keyResponsibilities: string[] | null;
  requirements: string[] | null;
  benefits: string[] | null;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: number;
}

interface JobCardProps {
  job: Job;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return "Salary not specified";
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salaryCurrency || 'USD',
      maximumFractionDigits: 0,
    });
    
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `From ${formatter.format(min)}`;
    if (max) return `Up to ${formatter.format(max)}`;
    return "Salary not specified";
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-out border-border/60 bg-card hover:shadow-lg hover:-translate-y-1",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-300" />
      
      <CardHeader className="pb-3 pt-6 pl-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors">
              {job.category}
            </Badge>
            <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground font-medium">
              <Building2 className="w-4 h-4" />
              <span>{job.company}</span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-primary">
              {job.postedAgo}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {job.locationType}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-6 pb-4">
        <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-secondary" />
            {job.location}
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-secondary" />
            {job.experienceLevel}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-secondary" />
            {job.employmentType}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3 mb-4">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {(job.keyResponsibilities || []).slice(0, 2).map((resp, i) => (
            <Badge key={i} variant="secondary" className="font-normal bg-secondary/10 text-secondary-foreground hover:bg-secondary/20">
              {resp}
            </Badge>
          ))}
          {(job.keyResponsibilities?.length || 0) > 2 && (
            <Badge variant="secondary" className="font-normal bg-muted text-muted-foreground">
              +{(job.keyResponsibilities?.length || 0) - 2} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pl-6 pt-2 pb-6 flex justify-between items-center border-t border-border/40 bg-muted/30">
        <div className="font-semibold text-sm text-foreground/90">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </div>
        <Button 
          asChild 
          className={cn(
            "transition-all duration-300 shadow-sm hover:shadow-md",
            isHovered ? "bg-primary text-primary-foreground translate-x-0 opacity-100" : "bg-primary/90"
          )}
        >
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            View Position
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

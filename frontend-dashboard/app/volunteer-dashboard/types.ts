export type DashboardTab = "overview" | "projects" | "achievements" | "recommendations";

export type Volunteer = {
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  location: string;
  interests: string[];
  availability: string;
  hoursVolunteered: number;
  completedProjects: number;
  impactScore: number;
  badgesEarned: number;
  currentlyActiveProjects: number;
  profileCompletion: number;
};

export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export type CompletedProject = {
  id: string;
  title: string;
  summary: string;
  category: string;
  completionDate: string;
  impactMetric: string;
  thumbnail: string;
};

export type ActiveProject = {
  id: string;
  title: string;
  nextMilestone: string;
  lead: string;
  progress: number;
};

export type Stat = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  earnedOn: string;
};

export type Opportunity = {
  id: string;
  title: string;
  location: string;
  commitment: string;
  reason: string;
};

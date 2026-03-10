import type {
  ActiveProject,
  Badge,
  CompletedProject,
  NavItem,
  Opportunity,
  Stat,
  Volunteer,
} from "./types";

export const volunteer: Volunteer = {
  name: "Amina Turkson",
  role: "Community Volunteer",
  avatarUrl:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
  bio: "I collaborate with local organizations to support climate literacy, youth learning, and neighborhood outreach programs.",
  location: "Philadelphia, PA",
  interests: [
    "Community Outreach",
    "Environmental Action",
    "Teaching",
    "Tech Support",
    "Fundraising",
  ],
  availability: "Currently active on 2 projects",
  hoursVolunteered: 184,
  completedProjects: 12,
  impactScore: 92,
  badgesEarned: 8,
  currentlyActiveProjects: 2,
  profileCompletion: 78,
};

export const sidebarNav: NavItem[] = [
  { id: "home", label: "Home", href: "#" },
  { id: "discover", label: "Discover Projects", href: "#" },
  { id: "contributions", label: "My Contributions", href: "#" },
  { id: "messages", label: "Messages", href: "#" },
  { id: "opportunities", label: "Opportunities", href: "#" },
  { id: "events", label: "Events", href: "#" },
  { id: "reports", label: "Impact Reports", href: "#" },
  { id: "saved", label: "Saved", href: "#" },
  { id: "settings", label: "Settings", href: "#" },
];

export const completedProjects: CompletedProject[] = [
  {
    id: "cp1",
    title: "Neighborhood Learning Pods",
    summary: "Organized weekly tutoring circles for underserved middle-school students.",
    category: "Education",
    completionDate: "Jan 22, 2026",
    impactMetric: "120 learners supported",
    thumbnail:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cp2",
    title: "Urban Tree Stewardship",
    summary: "Coordinated tree planting and maintenance with local green coalitions.",
    category: "Environment",
    completionDate: "Nov 10, 2025",
    impactMetric: "340 trees planted",
    thumbnail:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cp3",
    title: "Digital Access Workshops",
    summary: "Led weekend clinics helping seniors use online health and city resources.",
    category: "Digital Inclusion",
    completionDate: "Sep 18, 2025",
    impactMetric: "96 households reached",
    thumbnail:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  },
];

export const activeProjects: ActiveProject[] = [
  {
    id: "ap1",
    title: "Community Food Logistics",
    nextMilestone: "Saturday distribution scheduling",
    lead: "Kei Logistics",
    progress: 72,
  },
  {
    id: "ap2",
    title: "Youth Climate Fellowship",
    nextMilestone: "Curriculum draft review",
    lead: "Luis Water",
    progress: 46,
  },
];

export const stats: Stat[] = [
  { id: "s1", label: "Total Hours Served", value: "184h", hint: "This year" },
  { id: "s2", label: "Completed Projects", value: "12", hint: "All time" },
  { id: "s3", label: "Upcoming Events", value: "4", hint: "Next 30 days" },
  { id: "s4", label: "Badges Earned", value: "8", hint: "Milestones" },
];

export const badges: Badge[] = [
  {
    id: "b1",
    name: "100 Hours Badge",
    description: "Completed over 100 verified service hours.",
    earnedOn: "Dec 2025",
  },
  {
    id: "b2",
    name: "Community Builder",
    description: "Led recurring neighborhood engagement activities.",
    earnedOn: "Oct 2025",
  },
  {
    id: "b3",
    name: "Education Supporter",
    description: "Contributed to youth mentorship and tutoring tracks.",
    earnedOn: "Aug 2025",
  },
  {
    id: "b4",
    name: "Sustainability Champion",
    description: "Delivered measurable impact in environmental initiatives.",
    earnedOn: "May 2025",
  },
];

export const recommendations: Opportunity[] = [
  {
    id: "r1",
    title: "STEM Mentor Sprint",
    location: "Remote / Philly",
    commitment: "3 hrs/week",
    reason: "Matches your teaching + tech support profile",
  },
  {
    id: "r2",
    title: "River Cleanup Mobilizer",
    location: "Schuylkill Banks",
    commitment: "Weekend",
    reason: "Aligned with your environmental action track",
  },
  {
    id: "r3",
    title: "Fundraising Story Lead",
    location: "Hybrid",
    commitment: "4-week cycle",
    reason: "Uses your outreach + fundraising skills",
  },
];

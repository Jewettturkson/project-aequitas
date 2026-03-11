import type {
  ApplicationRow,
  EventRow,
  ManagerSection,
  MessageThread,
  TaskRow,
  VolunteerRow,
} from './types';

export const managerNav: Array<{ id: ManagerSection; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'My Projects' },
  { id: 'volunteers', label: 'Volunteers' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'messages', label: 'Messages' },
  { id: 'events', label: 'Events' },
  { id: 'impact', label: 'Impact Reports' },
  { id: 'applications', label: 'Applications' },
  { id: 'settings', label: 'Settings' },
];

export const volunteersMock: VolunteerRow[] = [
  {
    id: 'v1',
    name: 'Amina Turkson',
    skills: ['Community Outreach', 'Teaching'],
    assignment: 'Neighborhood Learning Pods',
    hours: 42,
    status: 'assigned',
  },
  {
    id: 'v2',
    name: 'Luis Water',
    skills: ['Water Systems', 'Planning'],
    assignment: 'Unassigned',
    hours: 18,
    status: 'needs-assignment',
  },
  {
    id: 'v3',
    name: 'Kei Logistics',
    skills: ['Coordination', 'Operations'],
    assignment: 'Urban Tree Stewardship',
    hours: 37,
    status: 'assigned',
  },
];

export const applicationsMock: ApplicationRow[] = [
  {
    id: 'a1',
    name: 'Benjamin Kofi Amoah',
    project: 'Digital Access Initiative',
    skillsMatch: 88,
    availability: 'Weekends',
    message: 'Happy to support device setup and digital literacy sessions.',
    appliedAt: 'Mar 10, 2026',
    state: 'pending',
  },
  {
    id: 'a2',
    name: 'Nora Mensah',
    project: 'Urban Tree Stewardship',
    skillsMatch: 79,
    availability: 'Evenings',
    message: 'I can support field coordination and volunteer onboarding.',
    appliedAt: 'Mar 9, 2026',
    state: 'saved',
  },
];

export const tasksMock: TaskRow[] = [
  {
    id: 't1',
    title: 'Confirm venue permits',
    volunteer: 'Kei Logistics',
    project: 'Urban Tree Stewardship',
    dueDate: '2026-03-14',
    priority: 'high',
    status: 'in_progress',
  },
  {
    id: 't2',
    title: 'Tutor roster for week 3',
    volunteer: 'Amina Turkson',
    project: 'Neighborhood Learning Pods',
    dueDate: '2026-03-13',
    priority: 'medium',
    status: 'todo',
  },
  {
    id: 't3',
    title: 'Publish attendance recap',
    volunteer: 'Luis Water',
    project: 'Digital Access Initiative',
    dueDate: '2026-03-11',
    priority: 'low',
    status: 'overdue',
  },
];

export const eventsMock: EventRow[] = [
  {
    id: 'e1',
    title: 'Volunteer Training Session',
    type: 'training',
    when: 'Mar 15, 2026 • 6:00 PM',
    location: 'Remote',
    rsvpCount: 23,
  },
  {
    id: 'e2',
    title: 'Tree Planting Kickoff',
    type: 'community',
    when: 'Mar 16, 2026 • 9:30 AM',
    location: 'Fairmount Park',
    rsvpCount: 31,
  },
];

export const messagesMock: MessageThread[] = [
  {
    id: 'm1',
    title: 'Urban Tree Stewardship Team',
    preview: 'Can we confirm tool pickup before Saturday?',
    unread: 3,
    updatedAt: '10m ago',
  },
  {
    id: 'm2',
    title: 'Amina Turkson',
    preview: 'Weekly tutoring report uploaded.',
    unread: 0,
    updatedAt: '1h ago',
  },
  {
    id: 'm3',
    title: 'Digital Access Initiative',
    preview: 'Attendance list for workshop is ready.',
    unread: 2,
    updatedAt: '3h ago',
  },
];

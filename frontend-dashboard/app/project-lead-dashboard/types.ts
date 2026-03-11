export type ManagerSection =
  | 'dashboard'
  | 'projects'
  | 'volunteers'
  | 'tasks'
  | 'messages'
  | 'events'
  | 'impact'
  | 'applications'
  | 'settings';

export type ManagerTab = 'overview' | 'projects' | 'volunteers' | 'analytics';

export type VolunteerRow = {
  id: string;
  name: string;
  skills: string[];
  assignment: string;
  hours: number;
  status: 'available' | 'assigned' | 'needs-assignment';
};

export type ApplicationRow = {
  id: string;
  name: string;
  project: string;
  skillsMatch: number;
  availability: string;
  message: string;
  appliedAt: string;
  state: 'pending' | 'saved' | 'accepted' | 'rejected';
};

export type TaskRow = {
  id: string;
  title: string;
  volunteer: string;
  project: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done' | 'overdue';
};

export type EventRow = {
  id: string;
  title: string;
  type: 'meeting' | 'training' | 'community';
  when: string;
  location: string;
  rsvpCount: number;
};

export type MessageThread = {
  id: string;
  title: string;
  preview: string;
  unread: number;
  updatedAt: string;
};

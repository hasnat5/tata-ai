// ============================================
// SCHEDULER TYPES
// ============================================

export type ScheduleStatus = "scheduled" | "processing" | "completed" | "failed";

export type ScheduledPost = {
  id: string;
  title: string;
  description: string;
  scheduledDate: Date;
  scheduledTime: string; // HH:mm format
  status: ScheduleStatus;
  platform?: string; // e.g., "twitter", "instagram", "facebook"
  content?: {
    text?: string;
    videoUrl?: string;
    imageUrl?: string;
    hashtags?: string[];
  };
  createdAt: number;
  error?: string;
};

export type SchedulerProject = {
  id: string;
  projectId: string; // Reference to main video project
  posts: ScheduledPost[];
  createdAt: number;
  updatedAt: number;
};

export type MonthCalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  posts: ScheduledPost[]; // Posts scheduled for this day
};

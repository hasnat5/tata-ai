"use client";

import { useEffect, useRef } from "react";
import { useSchedulerStore } from "./scheduler-store";
import type { ScheduledPost } from "./scheduler-types";

export function useScheduleChecker() {
  const { schedulerProject, updateScheduledPost } = useSchedulerStore();
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check every 1 minute
    checkIntervalRef.current = setInterval(async () => {
      if (!schedulerProject) return;

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // "09:30" format
      const currentDate = now.toISOString().split("T")[0]; // "2026-05-04" format

      // Find posts that are scheduled for NOW
      const postsToPost = schedulerProject.posts.filter((post) => {
        const postDate = new Date(post.scheduledDate)
          .toISOString()
          .split("T")[0];

        return (
          post.status === "scheduled" &&
          postDate === currentDate &&
          post.scheduledTime === currentTime // Time matches!
        );
      });

      // If found, post them!
      for (const post of postsToPost) {
        await postToSocialMedia(post, updateScheduledPost);
      }
    }, 60000); // Every 60 seconds

    return () => clearInterval(checkIntervalRef.current);
  }, [schedulerProject, updateScheduledPost]);
}

async function postToSocialMedia(
  post: ScheduledPost,
  updateScheduledPost: (postId: string, updates: Partial<ScheduledPost>) => void
) {
  try {
    console.log(`⏱️ Time to post: ${post.title}`);

    // Update status to processing
    updateScheduledPost(post.id, { status: "processing" });

    const response = await fetch("/api/scheduler/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });

    if (!response.ok) {
      throw new Error("Failed to post");
    }

    const data = await response.json();

    // Update status to completed
    updateScheduledPost(post.id, { status: "completed", error: undefined });

    console.log(`✅ Posted: ${post.title}`, data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Update status to failed with error message
    updateScheduledPost(post.id, { status: "failed", error: errorMessage });

    console.error(`❌ Failed to post: ${post.title}`, error);
  }
}

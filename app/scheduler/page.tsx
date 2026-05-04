"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useSchedulerStore } from "@/lib/scheduler-store";
import { useScheduleChecker } from "@/lib/useScheduleChecker";
import {
  Calendar,
  ScheduledPostsList,
  CreatePostModal,
  AllScheduledPosts,
} from "@/components/scheduler";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowLeft,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import type { ScheduledPost } from "@/lib/scheduler-types";

export default function SchedulerPage() {
  const { project } = useAppStore();
  const {
    schedulerProject,
    initSchedulerProject,
    addScheduledPost,
    deleteScheduledPost,
    _hasHydrated,
  } = useSchedulerStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  // Start background scheduler checker
  useScheduleChecker();

  // Initialize scheduler project on mount
  useEffect(() => {
    if (_hasHydrated && project && !schedulerProject) {
      initSchedulerProject(project.id);
    }
  }, [_hasHydrated, project, schedulerProject, initSchedulerProject]);

  // Create a Map of dates to posts for efficient lookup
  const postsByDateMap = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    if (schedulerProject) {
      schedulerProject.posts.forEach((post) => {
        const dateKey = new Date(post.scheduledDate)
          .toISOString()
          .split("T")[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(post);
      });
    }
    return map;
  }, [schedulerProject]);

  const selectedDatePosts = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split("T")[0];
    return postsByDateMap.get(dateKey) || [];
  }, [selectedDate, postsByDateMap]);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddPost = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const handleCreatePost = (postData: Omit<ScheduledPost, "id" | "createdAt">) => {
    const newPost: ScheduledPost = {
      ...postData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    addScheduledPost(newPost);
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Delete this scheduled post?")) {
      deleteScheduledPost(postId);
    }
  };

  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/images/tataAI_logo.png"
            alt="TataAI"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading scheduler...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Project Found</h1>
          <p className="text-muted-foreground mb-6">
            Please create a project first before scheduling posts.
          </p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                Post Scheduler
              </h1>
              <p className="text-xs text-muted-foreground">
                {project.name}
              </p>
            </div>
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <Calendar
              currentDate={currentDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              postsByDate={postsByDateMap}
            />
          </div>

          {/* Posts Section */}
          <div className="lg:col-span-2">
            <ScheduledPostsList
              date={selectedDate}
              posts={selectedDatePosts}
              onDeletePost={handleDeletePost}
              onAddPost={handleAddPost}
              onEditPost={setEditingPost}
            />
          </div>
        </div>

        {/* All Posts Table */}
        {schedulerProject && schedulerProject.posts.length > 0 && (
          <div className="mt-12">
            <AllScheduledPosts
              posts={schedulerProject.posts}
              onDeletePost={handleDeletePost}
              onSelectPost={(post) => {
                const postDate = new Date(post.scheduledDate);
                setSelectedDate(postDate);
                // Scroll to date in calendar if needed
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}

        {/* Statistics Card */}
        {schedulerProject && schedulerProject.posts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Total Posts
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {schedulerProject.posts.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-3xl font-bold mt-2 text-blue-600">
                      {
                        schedulerProject.posts.filter(
                          (p) => p.status === "scheduled"
                        ).length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold mt-2 text-green-600">
                      {
                        schedulerProject.posts.filter(
                          (p) => p.status === "completed"
                        ).length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-3xl font-bold mt-2 text-red-600">
                      {
                        schedulerProject.posts.filter((p) => p.status === "failed")
                          .length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        date={selectedDate || new Date()}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPost(null);
        }}
        onSubmit={handleCreatePost}
        editingPost={editingPost}
      />
    </div>
  );
}

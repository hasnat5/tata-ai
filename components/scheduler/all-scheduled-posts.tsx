"use client";

import React from "react";
import {
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ScheduledPost } from "@/lib/scheduler-types";
import { cn } from "@/lib/utils";

interface AllScheduledPostsProps {
  posts: ScheduledPost[];
  onDeletePost: (postId: string) => void;
  onSelectPost?: (post: ScheduledPost) => void;
}

const statusConfig = {
  scheduled: {
    icon: Clock,
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
};

export function AllScheduledPosts({
  posts,
  onDeletePost,
  onSelectPost,
}: AllScheduledPostsProps) {
  // Sort posts by date and time
  const sortedPosts = [...posts].sort((a, b) => {
    const aDate = new Date(a.scheduledDate).getTime();
    const bDate = new Date(b.scheduledDate).getTime();

    if (aDate !== bDate) return aDate - bDate;

    // If same date, sort by time
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-center">
            No scheduled posts yet. Create one to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          All Scheduled Posts
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Time</th>
                <th className="px-4 py-3 text-left font-semibold">Platform</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map((post, idx) => {
                const statusInfo = statusConfig[post.status];
                const StatusIcon = statusInfo.icon;
                const postDate = new Date(post.scheduledDate);
                const dateStr = postDate.toLocaleDateString("default", {
                  month: "short",
                  day: "numeric",
                  year: postDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                });

                return (
                  <tr
                    key={post.id}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      idx === sortedPosts.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectPost?.(post)}
                        className="text-left font-medium line-clamp-1 hover:underline text-blue-600 dark:text-blue-400"
                      >
                        {post.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {dateStr}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {post.scheduledTime}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.platform ? (
                        <Badge variant="outline" className="text-xs">
                          {post.platform === "instagram" && "📷"}
                          {post.platform === "facebook" && "👥"}
                          {" "}
                          {post.platform}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn("gap-1 text-xs", statusInfo.color)}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeletePost(post.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Error messages for failed posts */}
        {sortedPosts.some((p) => p.status === "failed" && p.error) && (
          <div className="mt-4 space-y-2 pt-4 border-t">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              Failed Posts:
            </p>
            {sortedPosts
              .filter((p) => p.status === "failed" && p.error)
              .map((post) => (
                <div
                  key={post.id}
                  className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded flex items-start gap-2"
                >
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-red-500 dark:text-red-300">{post.error}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

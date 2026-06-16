"use client";

import React from "react";
import {
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ScheduledPost } from "@/lib/scheduler-types";
import { cn } from "@/lib/utils";

interface ScheduledPostsListProps {
  date: Date | null;
  posts: ScheduledPost[];
  onDeletePost: (postId: string) => void;
  onAddPost: () => void;
  onEditPost?: (post: ScheduledPost) => void;
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

export function ScheduledPostsList({
  date,
  posts,
  onDeletePost,
  onAddPost,
  onEditPost,
}: ScheduledPostsListProps) {
  if (!date) {
    return (
      <Card className="flex-1">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-center">
            Select a date to view scheduled posts
          </p>
        </CardContent>
      </Card>
    );
  }

  const dateStr = date.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Scheduled Posts</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{dateStr}</p>
          </div>
          <Button
            size="sm"
            onClick={onAddPost}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Post
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No posts scheduled for this date</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddPost}
              className="mt-3 gap-2"
            >
              <Plus className="h-3 w-3" />
              Schedule First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const statusInfo = statusConfig[post.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {post.title}
                      </h4>
                      {post.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {post.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePost(post.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{post.scheduledTime}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("gap-1", statusInfo.color)}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {post.platform && (
                    <div className="pt-2 border-t">
                      <Badge variant="outline" className="text-xs">
                        {post.platform}
                      </Badge>
                    </div>
                  )}

                  {post.error && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
                      Error: {post.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

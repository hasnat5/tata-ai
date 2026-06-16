"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ScheduledPost } from "@/lib/scheduler-types";

interface CreatePostModalProps {
  isOpen: boolean;
  date: Date;
  onClose: () => void;
  onSubmit: (post: Omit<ScheduledPost, "id" | "createdAt">) => void;
  editingPost?: ScheduledPost | null;
}

const PLATFORMS = ["instagram", "facebook"];

export function CreatePostModal({
  isOpen,
  date,
  onClose,
  onSubmit,
  editingPost,
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("09:00");
  const [platform, setPlatform] = useState("instagram");
  const [selectedPlatform, setSelectedPlatform] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setDescription(editingPost.description);
      setTime(editingPost.scheduledTime);
      setPlatform(editingPost.platform || "instagram");
    } else {
      setTitle("");
      setDescription("");
      setTime("09:00");
      setPlatform("instagram");
    }
  }, [editingPost, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    const post: Omit<ScheduledPost, "id" | "createdAt"> = {
      title: title.trim(),
      description: description.trim(),
      scheduledDate: date,
      scheduledTime: time,
      status: "scheduled",
      platform: selectedPlatform ? platform : undefined,
      content: {
        text: description,
      },
    };

    onSubmit(post);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTime("09:00");
    setPlatform("instagram");
    setSelectedPlatform(false);
    onClose();
  };

  const dateStr = date.toLocaleDateString("default", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {editingPost ? "Edit Post" : "Schedule New Post"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dateStr} at {time}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">
              Post Title
            </Label>
            <Input
              id="title"
              placeholder="Enter post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">
              Description / Caption
            </Label>
            <Textarea
              id="description"
              placeholder="Enter post description or caption"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm">
              Scheduled Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-platform"
                checked={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="select-platform" className="text-sm font-normal">
                Select specific platform
              </Label>
            </div>
            {selectedPlatform && (
              <div className="flex flex-wrap gap-2 pt-2">
                {PLATFORMS.map((p) => (
                  <Badge
                    key={p}
                    variant={platform === p ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPlatform(p)}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {editingPost ? "Update Post" : "Schedule Post"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

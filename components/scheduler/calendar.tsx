"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/lib/scheduler-types";

interface CalendarProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  postsByDate: Map<string, ScheduledPost[]>; // Key: YYYY-MM-DD
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onDateSelect,
  selectedDate,
  postsByDate,
}: CalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get the first day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];

  // Add previous month's days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push(new Date(year, month - 1, prevMonthLastDay - i));
  }

  // Add current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  // Add next month's days
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push(new Date(year, month + 1, i));
  }

  const getDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const getPostsForDate = (date: Date): ScheduledPost[] => {
    return postsByDate.get(getDateKey(date)) || [];
  };

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{monthName}</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const posts = getPostsForDate(date);
          const hasPostsToday = posts.length > 0;
          const current = isCurrentMonth(date);
          const selected = isSelected(date);
          const today = isToday(date);

          return (
            <button
              key={getDateKey(date)}
              onClick={() => onDateSelect(date)}
              className={cn(
                "relative aspect-square rounded-md border transition-colors",
                current ? "border-border" : "border-transparent bg-muted/30",
                !current && "text-muted-foreground",
                selected && "border-primary bg-primary text-primary-foreground",
                today && !selected && "border-blue-500 bg-blue-50 dark:bg-blue-950",
                "hover:bg-accent hover:text-accent-foreground cursor-pointer flex flex-col items-center justify-center"
              )}
            >
              <span className="text-sm font-medium">{date.getDate()}</span>
              {hasPostsToday && (
                <div className="mt-1 flex gap-0.5">
                  {posts.slice(0, 2).map((_, i) => (
                    <div
                      key={i}
                      className="h-1 w-1 rounded-full bg-green-500"
                    />
                  ))}
                  {posts.length > 2 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 mt-0.5">
                      +{posts.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-blue-500 bg-blue-50 dark:bg-blue-950"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Settings, Clock, Bell, BellOff, Calendar, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface StatusBarProps {
  nextReminderTime?: Date;
  isReminderEnabled?: boolean;
  onToggleReminder?: () => void;
  onOpenSettings?: () => void;
  lastLogTime?: Date;
  jiraConnected?: boolean;
  openaiConnected?: boolean;
}

const StatusBar = ({
  nextReminderTime = new Date(Date.now() + 30 * 60 * 1000), // Default 30 minutes from now
  isReminderEnabled = true,
  onToggleReminder = () => {},
  onOpenSettings = () => {},
  lastLogTime = new Date(Date.now() - 2 * 60 * 60 * 1000), // Default 2 hours ago
  jiraConnected = false,
  openaiConnected = false,
}: StatusBarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Calculate time until next reminder
  const getTimeUntilReminder = () => {
    const diffMs = nextReminderTime.getTime() - currentTime.getTime();
    if (diffMs <= 0) return "Due now";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""}`;

    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h${remainingMins ? ` ${remainingMins}m` : ""}`;
  };

  // Format relative time for last log
  const getLastLogRelativeTime = () => {
    const diffMs = currentTime.getTime() - lastLogTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  return (
    <div className="w-full h-10 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-4 text-sm text-gray-600">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{formatTime(currentTime)}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>Last log: {getLastLogRelativeTime()}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Connection status indicators */}
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full ${jiraConnected ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  <span className="ml-1">Jira</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{jiraConnected ? "Jira connected" : "Jira not connected"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full ${openaiConnected ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                  <span className="ml-1">OpenAI</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {openaiConnected
                    ? "OpenAI connected"
                    : "OpenAI not connected"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Next reminder */}
        <div className="flex items-center space-x-1">
          {isReminderEnabled ? (
            <>
              <Bell className="h-4 w-4 text-blue-500" />
              <span>Next reminder: {getTimeUntilReminder()}</span>
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4 text-gray-500" />
              <span>Reminders disabled</span>
            </>
          )}
        </div>

        {/* Toggle reminder button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onToggleReminder}
              >
                {isReminderEnabled ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isReminderEnabled ? "Disable reminders" : "Enable reminders"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Settings button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onOpenSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default StatusBar;

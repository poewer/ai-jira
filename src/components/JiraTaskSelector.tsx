import React, { useState, useEffect, useMemo } from "react";
import { Search, Clock, Star, ExternalLink, RefreshCw } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { useJiraTasks } from "@/hooks/useJira";
import { JiraTask } from "@/services/jiraService";

interface JiraTaskSelectorProps {
  onTaskSelect?: (task: JiraTask) => void;
  isConnected?: boolean;
}

const JiraTaskSelector = ({
  onTaskSelect = () => {},
  isConnected = true,
}: JiraTaskSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<JiraTask | null>(null);
  
  const { tasks, loading, error, refetch } = useJiraTasks();

  // Filter tasks based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 3) return [];
    
    return tasks.filter(
      (task) =>
        task.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tasks]);

  // Get recent tasks - just take the first few
  const recentTasks = useMemo(() => {
    return tasks.slice(0, 5);
  }, [tasks]);

  const handleTaskSelect = (task: JiraTask) => {
    setSelectedTask(task);
    onTaskSelect(task);
    setSearchQuery(""); // Clear search after selection
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "to do":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="text-gray-400 mb-2">
              <ExternalLink className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-medium mb-1">Jira Not Connected</h3>
            <p className="text-sm text-gray-500 mb-3">
              Connect your Jira account in settings to select tasks
            </p>
            <Button variant="outline" size="sm">
              Open Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Add loading state
  if (loading && !tasks.length) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="text-red-400 mb-2">
              <ExternalLink className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-medium mb-1">Error Loading Tasks</h3>
            <p className="text-sm text-red-500 mb-3">
              {error.message}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch(true)}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Jira Tasks</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch(true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search Jira tasks (e.g. PROJ-123 or keyword)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {selectedTask && (
            <div className="p-3 border rounded-md bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {selectedTask.key}
                    </span>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(selectedTask.status)}
                    >
                      {selectedTask.status}
                    </Badge>
                  </div>
                  <p className="mt-1">{selectedTask.summary}</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedTask(null)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open in Jira</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {searchQuery.length > 2 &&
            searchResults.length === 0 &&
            !loading && (
              <div className="py-3 text-center text-sm text-gray-500">
                No tasks found matching "{searchQuery}"
              </div>
            )}

          {searchResults.length > 0 && (
            <ScrollArea className="h-[120px]">
              <div className="space-y-1">
                {searchResults.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => handleTaskSelect(task)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium">
                            {task.key}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(
                              task.status,
                            )} text-xs px-1.5 py-0`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm truncate">{task.summary}</p>
                      </div>
                      {task.isStarred && (
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {!searchQuery && !selectedTask && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Recent tasks</span>
              </div>
              <ScrollArea className="h-[120px]">
                <div className="space-y-1">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                      onClick={() => handleTaskSelect(task)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium">
                              {task.key}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(
                                task.status,
                              )} text-xs px-1.5 py-0`}
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-sm truncate">{task.summary}</p>
                        </div>
                        {task.isStarred && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JiraTaskSelector;
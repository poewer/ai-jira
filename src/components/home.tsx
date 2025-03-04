import React, { useState, useEffect } from "react";
import {
  Clock,
  Bell,
  FileText,
  PenSquare,
  LayoutDashboard,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ReminderPopup from "./ReminderPopup";
import SettingsPanel from "./SettingsPanel";
import StatusBar from "./StatusBar";
import JiraTaskSelector from "./JiraTaskSelector";
import EnhancedTimeTracking from "./EnhancedTimeTracking";
import { useJiraConnection, useWorklogs, useJiraTasks } from "@/hooks/useJira";
import { CacheService } from "@/services/cacheService";
import { jiraService, JiraTask } from "@/services/jiraService";

interface WorkLog {
  id: string;
  timestamp: Date;
  description: string;
  jiraTask?: {
    key: string;
    summary: string;
  };
  hasScreenshot: boolean;
  aiEnhanced: boolean;
}

const Home = () => {
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReminderEnabled, setIsReminderEnabled] = useState(true);
  const [nextReminderTime, setNextReminderTime] = useState(
    new Date(Date.now() + 30 * 60 * 1000),
  );
  const [lastLogTime, setLastLogTime] = useState<Date | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      description:
        "Implemented the UI components for the work logging assistant application. Created the main layout, reminder popup, and settings panel.",
      jiraTask: {
        key: "PROJ-123",
        summary: "Implement UI components",
      },
      hasScreenshot: true,
      aiEnhanced: true,
    },
  ]);
  const [selectedTask, setSelectedTask] = useState<JiraTask | null>(null);

  // Get current date for jira worklogs
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Jira connection status
  const { isConnected: jiraConnected, loading: jiraLoading, testConnection } = useJiraConnection();
  const [openaiConnected, setOpenaiConnected] = useState(false);

  // Get actual Jira worklog data
  const { 
    worklogs: jiraWorklogs, 
    totalTimeMinutes,
    worklogsByTask,
    refetch: refetchWorklogs
  } = useWorklogs(currentMonth, currentYear);

  // Get Jira tasks
  const { tasks: jiraTasks, refetch: refetchTasks } = useJiraTasks();

  // Calculate statistics from Jira data
  const jiraLogCount = jiraWorklogs.length;
  const totalHours = totalTimeMinutes / 60;
  const percentageComplete = (totalHours / 168) * 100; // 168 is the monthly target

  // Load workLogs from localStorage on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('work_logs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        // Convert string timestamps back to Date objects
        const formattedLogs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setWorkLogs(formattedLogs);
      }
    } catch (error) {
      console.error('Error loading work logs from localStorage:', error);
    }
    
    // Also load OpenAI connection status
    const savedOpenAIStatus = localStorage.getItem('openai_connected');
    if (savedOpenAIStatus) {
      setOpenaiConnected(savedOpenAIStatus === 'true');
    }
  }, []);

  // Load reminder settings from localStorage on startup
  useEffect(() => {
    // Load reminder state
    const savedReminderEnabled = localStorage.getItem('reminder_enabled');
    if (savedReminderEnabled !== null) {
      setIsReminderEnabled(savedReminderEnabled === 'true');
    }
    
    // Load next reminder time
    const savedNextReminderTime = localStorage.getItem('next_reminder_time');
    if (savedNextReminderTime) {
      const parsedTime = new Date(savedNextReminderTime);
      // Only use saved time if it's in the future
      if (parsedTime.getTime() > Date.now()) {
        setNextReminderTime(parsedTime);
      } else {
        // If the saved time is in the past, set a new time 30 minutes from now
        setNextReminderTime(new Date(Date.now() + 30 * 60 * 1000));
      }
    }
  }, []);
  
  // Check for stale cache and refresh data if needed
  useEffect(() => {
    const checkAndRefreshCache = async () => {
      // Get user email from localStorage
      let userEmail = 'user';
      try {
        const credentials = localStorage.getItem('jira_credentials');
        if (credentials) {
          userEmail = JSON.parse(credentials).email;
        }
      } catch (error) {
        console.error('Error parsing credentials from localStorage:', error);
      }
      
      // Check if tasks cache is stale (older than 30 minutes)
      const tasksLastUpdated = CacheService.getLastUpdated(`jira_tasks_${userEmail}`);
      if (!tasksLastUpdated || (Date.now() - tasksLastUpdated > 30 * 60 * 1000)) {
        console.log('Tasks cache is stale, refreshing...');
        refetchTasks(true);
      }

      // Check if worklogs cache is stale (older than 15 minutes)
      const worklogsLastUpdated = CacheService.getLastUpdated(`jira_all_worklogs_${userEmail}_${currentMonth}_${currentYear}`);
      if (!worklogsLastUpdated || (Date.now() - worklogsLastUpdated > 15 * 60 * 1000)) {
        console.log('Worklogs cache is stale, refreshing...');
        refetchWorklogs(true);
      }
    };
    
    // Run check on component mount
    checkAndRefreshCache();
    
    // Also set up interval to periodically check for stale cache (every 5 minutes)
    const intervalId = setInterval(checkAndRefreshCache, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentMonth, currentYear, refetchTasks, refetchWorklogs]);

  // Update last log time from jira logs when available
  useEffect(() => {
    if (jiraWorklogs.length > 0) {
      // Sort logs by date (newest first)
      const sortedLogs = [...jiraWorklogs].sort((a, b) => 
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
      
      // Update the last log time
      setLastLogTime(new Date(sortedLogs[0].updated));
      
      // Also save to localStorage for persistence between sessions
      localStorage.setItem('last_log_time', sortedLogs[0].updated);
    } else {
      // Try to get from localStorage if no logs available
      const savedLastLogTime = localStorage.getItem('last_log_time');
      if (savedLastLogTime) {
        setLastLogTime(new Date(savedLastLogTime));
      }
    }
  }, [jiraWorklogs]);
  
  // Set up reminder timer
  useEffect(() => {
    if (!isReminderEnabled) return;

    const timeUntilReminder = nextReminderTime.getTime() - Date.now();
    if (timeUntilReminder <= 0) {
      // Show reminder immediately if it's due
      setIsReminderOpen(true);
      // Set next reminder for 30 minutes from now
      const newReminderTime = new Date(Date.now() + 30 * 60 * 1000);
      setNextReminderTime(newReminderTime);
      // Save to localStorage
      localStorage.setItem('next_reminder_time', newReminderTime.toISOString());
      return;
    }

    // Set timer for next reminder
    const timerId = setTimeout(() => {
      setIsReminderOpen(true);
      // Set next reminder for 30 minutes after this one
      const newReminderTime = new Date(Date.now() + 30 * 60 * 1000);
      setNextReminderTime(newReminderTime);
      // Save to localStorage
      localStorage.setItem('next_reminder_time', newReminderTime.toISOString());
    }, timeUntilReminder);

    return () => clearTimeout(timerId);
  }, [isReminderEnabled, nextReminderTime]);

  const handleToggleReminder = () => {
    const newState = !isReminderEnabled;
    setIsReminderEnabled(newState);
    // Save to localStorage
    localStorage.setItem('reminder_enabled', newState.toString());
    
    if (newState) {
      // If enabling reminders, set next reminder time
      const newReminderTime = new Date(Date.now() + 30 * 60 * 1000);
      setNextReminderTime(newReminderTime);
      // Save to localStorage
      localStorage.setItem('next_reminder_time', newReminderTime.toISOString());
    }
  };

  const handleReminderSubmit = async (data: {
    workDescription: string;
    includeScreenshot: boolean;
    useAiEnhancement: boolean;
    screenshot?: string;
    jiraTask?: JiraTask;
  }) => {
    // Create a new work log entry
    const currentTime = new Date();
    const newLog: WorkLog = {
      id: currentTime.getTime().toString(),
      timestamp: currentTime,
      description: data.workDescription,
      hasScreenshot: data.includeScreenshot,
      aiEnhanced: data.useAiEnhancement,
      jiraTask: data.jiraTask ? {
        key: data.jiraTask.key,
        summary: data.jiraTask.summary
      } : undefined
    };

    // Add to state
    const updatedLogs = [newLog, ...workLogs];
    setWorkLogs(updatedLogs);
    
    // Update last log time
    setLastLogTime(currentTime);
    localStorage.setItem('last_log_time', currentTime.toISOString());
    
    // Save to localStorage
    try {
      // Save only the 20 most recent logs to avoid bloating localStorage
      const logsToSave = updatedLogs.slice(0, 20);
      localStorage.setItem('work_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Error saving work logs to localStorage:', error);
    }
    
    // If Jira task is selected, log time to Jira
    if (data.jiraTask && jiraConnected) {
      try {
        // Default to 1h if no time specified in the description
        let timeSpent = "1h";
        
        // Try to extract time pattern like 2h 30m from the description
        const timePattern = /(\d+[wdhm]\s*)+/i;
        const timeMatch = data.workDescription.match(timePattern);
        if (timeMatch && timeMatch[0]) {
          timeSpent = timeMatch[0].trim();
        }
        
        await jiraService.addWorklog(
          data.jiraTask.key,
          timeSpent,
          data.workDescription
        );
        
        // Force refresh worklogs after successful submission
        setTimeout(() => {
          refetchWorklogs(true);
        }, 1500);
      } catch (error) {
        console.error('Error logging work to Jira:', error);
      }
    }
    
    setIsReminderOpen(false);
  };

  const handleSaveSettings = (settings: any) => {
    // Update settings
    setOpenaiConnected(settings.apis.openai.enabled);
    
    // Save openAI connection status to localStorage
    localStorage.setItem('openai_connected', settings.apis.openai.enabled.toString());

    // Update reminder frequency
    const reminderFrequencyMs = settings.general.reminderFrequency * 60 * 1000;
    const newReminderTime = new Date(Date.now() + reminderFrequencyMs);
    setNextReminderTime(newReminderTime);
    
    // Save to localStorage
    localStorage.setItem('next_reminder_time', newReminderTime.toISOString());
    localStorage.setItem('reminder_frequency', settings.general.reminderFrequency.toString());
    
    // If Jira credentials changed, retest the connection and refresh data
    if (settings.apis.jira.enabled) {
      // Wait a short time for the credential change to apply
      setTimeout(() => {
        testConnection();
        refetchTasks(true);
        refetchWorklogs(true);
      }, 1000);
    }
  };

  // Function to manually refresh all data
  const refreshAllData = () => {
    console.log('Refreshing all data...');
    // Refresh Jira connection
    testConnection();
    // Refresh tasks
    refetchTasks(true);
    // Refresh worklogs
    refetchWorklogs(true);
  };
  
  // Function to handle task selection
  const handleTaskSelect = (task: JiraTask) => {
    setSelectedTask(task);
  };

  // Create displayable logs - combine mock UI and actual Jira logs
  const displayLogs = jiraWorklogs.length > 0 
    ? jiraWorklogs.map(log => ({
        id: log.id,
        timestamp: new Date(log.updated),
        description: log.comment,
        jiraTask: {
          key: log.issueKey,
          summary: log.issueKey,
        },
        hasScreenshot: false,
        aiEnhanced: false,
      }))
    : workLogs;

  // Count AI-enhanced logs
  const aiEnhancedCount = displayLogs.filter(log => log.aiEnhanced).length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex-1 container mx-auto py-6 px-4 overflow-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Work Time Logging Assistant
          </h1>
          <p className="text-gray-500">
            Track your work activities efficiently and seamlessly
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main dashboard area */}
          <div className="lg:col-span-2 space-y-6">
            <EnhancedTimeTracking />
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Dashboard</CardTitle>
                    <CardDescription>
                      Overview of your work logging activity
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsReminderOpen(true)}>
                    <PenSquare className="mr-2 h-4 w-4" />
                    Log Work
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <Clock className="h-8 w-8 text-blue-500 mb-2" />
                      <p className="text-sm text-gray-500">Next Reminder</p>
                      <p className="text-xl font-semibold">
                        {isReminderEnabled
                          ? new Date(nextReminderTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Disabled"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <FileText className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-sm text-gray-500">Total Logs</p>
                      <p className="text-xl font-semibold">{jiraLogCount > 0 ? jiraLogCount : workLogs.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <Zap className="h-8 w-8 text-purple-500 mb-2" />
                      <p className="text-sm text-gray-500">AI Enhanced</p>
                      <p className="text-xl font-semibold">
                        {aiEnhancedCount}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="recent">
                  <TabsList className="mb-4">
                    <TabsTrigger value="recent">Recent Logs</TabsTrigger>
                    <TabsTrigger value="jira">Jira Tasks</TabsTrigger>
                  </TabsList>
                  <TabsContent value="recent" className="space-y-4">
                    {displayLogs.length > 0 ? (
                      displayLogs.map((log) => (
                        <Card key={log.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {log.timestamp.toLocaleString()}
                                </span>
                                {log.jiraTask && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">
                                    {log.jiraTask.key}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {log.hasScreenshot && (
                                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                    Screenshot
                                  </span>
                                )}
                                {log.aiEnhanced && (
                                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                    AI Enhanced
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700">{log.description}</p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>
                          No work logs yet. Click "Log Work" to get started.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="jira">
                    <JiraTaskSelector 
                      isConnected={jiraConnected} 
                      onTaskSelect={handleTaskSelect}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start"
                  onClick={() => setIsReminderOpen(true)}
                >
                  <PenSquare className="mr-2 h-4 w-4" />
                  Log Work Now
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Open Settings
                </Button>
                <Button
                  className="w-full justify-start"
                  variant={isReminderEnabled ? "destructive" : "outline"}
                  onClick={handleToggleReminder}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {isReminderEnabled ? "Disable Reminders" : "Enable Reminders"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Jira Integration</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${jiraConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {jiraConnected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>OpenAI Integration</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${openaiConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {openaiConnected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <div className="flex flex-col space-y-2">
                  {(!jiraConnected || !openaiConnected) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      Configure Integrations
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={refreshAllData}
                    disabled={jiraLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${jiraLoading ? 'animate-spin' : ''}`} />
                    Refresh All Data
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Clear all app-related cache but leave credentials
                      const credentials = localStorage.getItem('jira_credentials');
                      const openaiStatus = localStorage.getItem('openai_connected');
                      
                      Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('jira_')) {
                          localStorage.removeItem(key);
                        }
                      });
                      
                      // Restore credentials
                      if (credentials) {
                        localStorage.setItem('jira_credentials', credentials);
                      }
                      if (openaiStatus) {
                        localStorage.setItem('openai_connected', openaiStatus);
                      }
                      
                      // Then refresh all data
                      refreshAllData();
                    }}
                  >
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        nextReminderTime={nextReminderTime}
        isReminderEnabled={isReminderEnabled}
        onToggleReminder={handleToggleReminder}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lastLogTime={lastLogTime || workLogs[0]?.timestamp}
        jiraConnected={jiraConnected}
        openaiConnected={openaiConnected}
      />

      {/* Modals */}
      <ReminderPopup
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onSubmit={handleReminderSubmit}
        selectedTask={selectedTask}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default Home;
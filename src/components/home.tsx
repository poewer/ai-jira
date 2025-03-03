import React, { useState, useEffect } from "react";
import {
  Clock,
  Bell,
  FileText,
  PenSquare,
  LayoutDashboard,
  Zap,
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
    // Pozostałe zamockowane logs...
  ]);

  // Get current date for jira worklogs
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Jira connection status
  const { isConnected: jiraConnected, loading: jiraLoading } = useJiraConnection();
  const [openaiConnected, setOpenaiConnected] = useState(false);

  // Get actual Jira worklog data
  const { 
    worklogs: jiraWorklogs, 
    totalTimeMinutes,
    worklogsByTask 
  } = useWorklogs(currentMonth, currentYear);

  // Calculate statistics from Jira data
  const jiraLogCount = jiraWorklogs.length;
  const totalHours = totalTimeMinutes / 60;
  const percentageComplete = (totalHours / 168) * 100; // 168 is the monthly target

  // Update last log time from jira logs when available
  useEffect(() => {
    if (jiraWorklogs.length > 0) {
      // Sort logs by date (newest first)
      const sortedLogs = [...jiraWorklogs].sort((a, b) => 
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
      
      // Update the last log time
      setLastLogTime(new Date(sortedLogs[0].updated));
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
      setNextReminderTime(new Date(Date.now() + 30 * 60 * 1000));
      return;
    }

    // Set timer for next reminder
    const timerId = setTimeout(() => {
      setIsReminderOpen(true);
      // Set next reminder for 30 minutes after this one
      setNextReminderTime(new Date(Date.now() + 30 * 60 * 1000));
    }, timeUntilReminder);

    return () => clearTimeout(timerId);
  }, [isReminderEnabled, nextReminderTime]);

  const handleToggleReminder = () => {
    setIsReminderEnabled(!isReminderEnabled);
    if (!isReminderEnabled) {
      // If enabling reminders, set next reminder time
      setNextReminderTime(new Date(Date.now() + 30 * 60 * 1000));
    }
  };

  const handleReminderSubmit = (data: {
    workDescription: string;
    includeScreenshot: boolean;
    useAiEnhancement: boolean;
    screenshot?: string;
  }) => {
    // Create a new work log entry
    const newLog: WorkLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      description: data.workDescription,
      hasScreenshot: data.includeScreenshot,
      aiEnhanced: data.useAiEnhancement,
    };

    setWorkLogs([newLog, ...workLogs]);
    setLastLogTime(new Date());
    setIsReminderOpen(false);
  };

  const handleSaveSettings = (settings: any) => {
    // Update settings
    setOpenaiConnected(settings.apis.openai.enabled);

    // Update reminder frequency
    const reminderFrequencyMs = settings.general.reminderFrequency * 60 * 1000;
    setNextReminderTime(new Date(Date.now() + reminderFrequencyMs));
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
                    <JiraTaskSelector isConnected={jiraConnected} />
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
                {(!jiraConnected || !openaiConnected) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    Configure Integrations
                  </Button>
                )}
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
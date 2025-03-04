import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useWorklogs } from '../hooks/useJira';
import { jiraService } from '../services/jiraService';
import { Skeleton } from './ui/skeleton';
import { Calendar, ArrowUp, ArrowDown, FileText, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const years = [2023, 2024, 2025].map(year => ({
  value: year.toString(),
  label: year.toString()
}));

const EnhancedTimeTracking = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState('summary');

  // Get data from the hook
  const {
    worklogs,
    loading,
    error,
    totalTimeMinutes,
    worklogsByTask,
    refetch
  } = useWorklogs(month, year);

  // Monthly target in hours
  const targetHours = 168;
  const totalHours = totalTimeMinutes / 60;
  const percentageComplete = (totalHours / targetHours) * 100;

  // Calculate remaining hours
  const remainingHours = targetHours - totalHours;

  // Calculate working days left in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = currentDate.getMonth() + 1 === month ? currentDate.getDate() : daysInMonth;
  const workdaysLeft = Math.max(0, calculateBusinessDaysLeft(year, month, currentDay, daysInMonth));

  // Daily average needed to reach target
  const dailyHoursNeeded = workdaysLeft > 0 ? remainingHours / workdaysLeft : 0;

  function calculateBusinessDaysLeft(year: number, month: number, startDay: number, totalDays: number) {
    let businessDays = 0;

    for (let day = startDay; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }

    return businessDays;
  }

  // Sort tasks by time spent
  const sortedTasks = Object.entries(worklogsByTask)
    .map(([taskKey, logs]) => ({
      taskKey,
      totalMinutes: logs.reduce((sum, log) => sum + log.timeSpentMinutes, 0)
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Format time as 1w 2d 4h format
  const formatTimeDisplay = (minutes: number) => {
    return jiraService.formatMinutes(minutes);
  };

  // Function to handle refresh button click
  const handleRefresh = () => {
    refetch(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Work Log Statistics</CardTitle>
          <CardDescription>Track your monthly time logs and progress</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Select
            value={month.toString()}
            onValueChange={(value) => setMonth(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={year.toString()}
            onValueChange={(value) => setYear(parseInt(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Error loading work logs: {error.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Progress toward monthly goal */}
            <div className="mb-6 space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-500">Progress toward {targetHours}h monthly goal</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {totalHours.toFixed(1)}h / {targetHours}h ({percentageComplete.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <Progress value={percentageComplete} className="h-2" />
            </div>

            {/* Time stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Total Time</p>
                    <p className="text-2xl font-bold">{formatTimeDisplay(totalTimeMinutes)}</p>
                    <p className="text-sm text-gray-500">{totalHours.toFixed(1)}h total</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="text-2xl font-bold">{remainingHours.toFixed(1)}h</p>
                    <p className="text-sm text-gray-500">
                      {Math.max(0, targetHours - totalHours).toFixed(1)}h left to target
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Days Left</p>
                    <p className="text-2xl font-bold">{workdaysLeft}</p>
                    <p className="text-sm text-gray-500">Business days remaining</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Daily Goal</p>
                    <p className="text-2xl font-bold">{dailyHoursNeeded.toFixed(1)}h</p>
                    <p className="text-sm text-gray-500">Needed per day to reach target</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="summary">Task Summary</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="space-y-4">
                  {sortedTasks.length > 0 ? (
                    sortedTasks.map(({ taskKey, totalMinutes }) => {
                      const taskHours = totalMinutes / 60;
                      const taskPercentage = (taskHours / targetHours) * 100;

                      return (
                        <div key={taskKey} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="font-mono text-sm">{taskKey}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium">
                                {formatTimeDisplay(totalMinutes)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({taskHours.toFixed(1)}h)
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {taskPercentage.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={taskPercentage} className="h-1" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 border rounded-md bg-gray-50">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 mb-1">No time logs found for {months[month - 1]?.label} {year}</p>
                      <p className="text-sm text-gray-400">Log your work to see time statistics</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="detailed">
                <div className="overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="p-2 text-left font-medium">Task</th>
                        <th className="p-2 text-left font-medium">Date</th>
                        <th className="p-2 text-left font-medium">Time Spent</th>
                        <th className="p-2 text-left font-medium">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {worklogs.length > 0 ? (
                        worklogs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-slate-50">
                            <td className="p-2 font-mono">{log.issueKey}</td>
                            <td className="p-2">
                              {new Date(log.updated).toLocaleDateString()}
                            </td>
                            <td className="p-2">{log.timeSpent} ({(log.timeSpentMinutes / 60).toFixed(1)}h)</td>
                            <td className="p-2 max-w-md truncate">{log.comment}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-12 text-center">
                            <div className="flex flex-col items-center">
                              <FileText className="h-12 w-12 mb-3 text-gray-300" />
                              <p className="text-gray-500 mb-1">No time logs found for {months[month - 1]?.label} {year}</p>
                              <p className="text-sm text-gray-400">Log your work to see detailed logs</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTimeTracking;
// src/components/WorkLogStats.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useWorklogs } from '@/hooks/useJira';
import { jiraService } from '@/services/jiraService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

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

const WorkLogStats = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  
  const { worklogs, loading, error, totalTimeMinutes, worklogsByTask, refetch } = useWorklogs(month, year);
  
  // Calculate total hours
  const totalHours = totalTimeMinutes / 60;
  
  // Estimated hours in a month (assuming 168h is what you're targeting)
  const targetHours = 168;
  const percentageComplete = (totalHours / targetHours) * 100;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Work Log Statistics</CardTitle>
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
              onClick={() => refetch(true)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
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
          </div>
        ) : (
          <Tabs defaultValue="summary">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Total Time</h3>
                      <p className="text-2xl font-bold">{jiraService.formatMinutes(totalTimeMinutes)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Hours</h3>
                      <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Completion</h3>
                      <p className="text-2xl font-bold">{percentageComplete.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Task Time Summary</h3>
                  
                  {Object.entries(worklogsByTask).map(([taskKey, logs]) => {
                    const taskMinutes = logs.reduce((sum, log) => sum + log.timeSpentMinutes, 0);
                    const taskHours = taskMinutes / 60;
                    
                    return (
                      <div key={taskKey} className="flex justify-between p-2 bg-white border rounded-md">
                        <div className="font-mono">{taskKey}</div>
                        <div className="flex space-x-4">
                          <span>{jiraService.formatMinutes(taskMinutes)}</span>
                          <span className="text-slate-500">({taskHours.toFixed(1)}h)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="detailed">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-2 text-left border">ID</th>
                      <th className="p-2 text-left border">Time Spent</th>
                      <th className="p-2 text-left border">Updated</th>
                      <th className="p-2 text-left border">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worklogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-2 border font-mono">{log.issueKey}</td>
                        <td className="p-2 border">{log.timeSpent}</td>
                        <td className="p-2 border">{new Date(log.updated).toLocaleDateString()}</td>
                        <td className="p-2 border">{log.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkLogStats;
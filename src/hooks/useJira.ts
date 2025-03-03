// src/hooks/useJira.ts
import { useState, useEffect } from 'react';
import { jiraService, JiraTask, WorkLog } from '@/services/jiraService';

export function useJiraTasks() {
  const [tasks, setTasks] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tasks = await jiraService.getUserTasks();
      setTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { tasks, loading, error, refetch: fetchTasks };
}

export function useWorklogs(month?: number, year?: number) {
  const [worklogs, setWorklogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorklogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const logs = await jiraService.getAllWorklogs(month, year);
      setWorklogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklogs();
  }, [month, year]);

  return { 
    worklogs, 
    loading, 
    error, 
    refetch: fetchWorklogs,
    
    // Helper to calculate total time
    totalTimeMinutes: worklogs.reduce((total, log) => total + log.timeSpentMinutes, 0),
    
    // Group by task
    worklogsByTask: worklogs.reduce((acc, log) => {
      if (!acc[log.issueKey]) {
        acc[log.issueKey] = [];
      }
      acc[log.issueKey].push(log);
      return acc;
    }, {} as Record<string, WorkLog[]>)
  };
}

export function useJiraConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const testConnection = async () => {
    setLoading(true);
    const connected = await jiraService.testConnection();
    setIsConnected(connected);
    setLoading(false);
    return connected;
  };

  useEffect(() => {
    testConnection();
  }, []);

  return { isConnected, loading, testConnection };
}
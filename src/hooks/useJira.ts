// src/hooks/useJira.ts
import { useState, useEffect, useCallback } from 'react';
import { jiraService, JiraTask, WorkLog } from '@/services/jiraService';
import { CacheService } from '@/services/cacheService';

export function useJiraTasks() {
  const [tasks, setTasks] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const tasks = forceRefresh 
        ? await jiraService.refreshUserTasks() 
        : await jiraService.getUserTasks();
      setTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    
    // Sprawdź, kiedy ostatnio odświeżaliśmy dane
    const userEmail = jiraService.getCurrentUserEmail() || 'user';

    const cacheKey = `jira_tasks_${userEmail}`;
    const lastUpdated = CacheService.getLastUpdated(cacheKey);
    const now = Date.now();
    
    // Jeśli minęła godzina lub nie ma timestamp'u, odśwież dane
    if (!lastUpdated || (now - lastUpdated > 60 * 60 * 1000)) {
      fetchTasks(true);
    }
  }, [fetchTasks]);

  return { 
    tasks, 
    loading, 
    error, 
    refetch: fetchTasks 
  };
}

export function useWorklogs(month?: number, year?: number) {
  const [worklogs, setWorklogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorklogs = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const logs = forceRefresh
        ? await jiraService.refreshAllWorklogs(month, year)
        : await jiraService.getAllWorklogs(month, year);
      setWorklogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchWorklogs();
    
    // Sprawdź, kiedy ostatnio odświeżaliśmy dane
    const cacheKey = `jira_all_worklogs_${jiraService.getCurrentUserEmail()}_${month || 'all'}_${year || 'all'}`;
    const lastUpdated = CacheService.getLastUpdated(cacheKey);
    const now = Date.now();
    
    // Jeśli minęło 30 minut lub nie ma timestamp'u, odśwież dane
    if (!lastUpdated || (now - lastUpdated > 30 * 60 * 1000)) {
      fetchWorklogs(true);
    }
  }, [fetchWorklogs, month, year]);

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

  const testConnection = useCallback(async () => {
    setLoading(true);
    const connected = await jiraService.testConnection();
    setIsConnected(connected);
    setLoading(false);
    return connected;
  }, []);

  useEffect(() => {
    testConnection();
    
    // Sprawdzaj połączenie co 15 minut
    const checkInterval = setInterval(() => {
      testConnection();
    }, 15 * 60 * 1000);
    
    return () => clearInterval(checkInterval);
  }, [testConnection]);

  return { isConnected, loading, testConnection };
}
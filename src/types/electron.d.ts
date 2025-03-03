// src/types/electron.d.ts
import { JiraCredentials } from '../services/jiraService';

interface Window {
  electronAPI?: {
    callJiraAPI: (endpoint: string, method: string, data?: any) => Promise<any>;
    setJiraCredentials: (credentials: JiraCredentials) => Promise<boolean>;
  }
}
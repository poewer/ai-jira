// src/services/jiraService.ts
export interface JiraCredentials {
    email: string;
    apiToken: string;
    domain: string;
  }
  
  export interface JiraTask {
    id: string;
    key: string;
    summary: string;
    status: string;
    isStarred?: boolean;
    lastUpdated?: string;
  }
  
  export interface WorkLog {
    id: string;
    issueId: string;
    issueKey: string;
    timeSpent: string;
    timeSpentMinutes: number;
    comment: string;
    updated: string;
  }
  
  class JiraService {
    private credentials: JiraCredentials | null = null;
  
    constructor() {
      this.loadCredentials();
    }
  
    private async loadCredentials(): Promise<void> {
      // Load from localStorage or your preferred storage
      const credentials = localStorage.getItem('jira_credentials');
      if (credentials) {
        this.credentials = JSON.parse(credentials);
        // Ustaw poświadczenia również w głównym procesie
        if (window.electronAPI) {
          await window.electronAPI.setJiraCredentials(this.credentials);
        }
      }
    }
  
    public async setCredentials(credentials: JiraCredentials): Promise<void> {
      this.credentials = credentials;
      localStorage.setItem('jira_credentials', JSON.stringify(credentials));
      
      // Ustaw poświadczenia również w głównym procesie
      if (window.electronAPI) {
        await window.electronAPI.setJiraCredentials(credentials);
      }
    }
  
    // Podstawowa metoda do wywoływania API Jira przez Electron
    private async callJiraAPI(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
      if (!this.credentials) throw new Error('Jira credentials not set');
      
      try {
        if (window.electronAPI) {
          return await window.electronAPI.callJiraAPI(endpoint, method, data);
        } else {
          throw new Error('Electron API not available');
        }
      } catch (error) {
        console.error('Error calling Jira API:', error);
        throw error;
      }
    }
  
    public async getCurrentUser(): Promise<any> {
      if (!this.credentials) throw new Error('Jira credentials not set');
      
      const { email } = this.credentials;
      const endpoint = `/rest/api/3/user/search?query=${encodeURIComponent(email)}`;
      
      const data = await this.callJiraAPI(endpoint, 'GET');
      return data[0];
    }
  
    public async getUserTasks(): Promise<JiraTask[]> {
      if (!this.credentials) throw new Error('Jira credentials not set');
      
      const endpoint = `/rest/api/3/search?jql=assignee=currentuser()`;
      
      const data = await this.callJiraAPI(endpoint, 'GET');
      
      return data.issues.map((issue: any) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        lastUpdated: issue.fields.updated
      }));
    }
  
    public async getTaskWorklogs(taskKey: string): Promise<WorkLog[]> {
      if (!this.credentials) throw new Error('Jira credentials not set');
      
      const endpoint = `/rest/api/3/issue/${taskKey}/worklog`;
      
      const data = await this.callJiraAPI(endpoint, 'GET');
      const currentUser = await this.getCurrentUser();
      
      return data.worklogs
        .filter((worklog: any) => worklog.author.displayName === currentUser.displayName)
        .map((worklog: any) => ({
          id: worklog.id,
          issueId: taskKey,
          issueKey: taskKey,
          timeSpent: worklog.timeSpent,
          timeSpentMinutes: this.convertToMinutes(worklog.timeSpent),
          comment: worklog.comment?.content?.[0]?.content?.[0]?.text || '',
          updated: worklog.updated
        }));
    }
  
    public async getAllWorklogs(month?: number, year?: number): Promise<WorkLog[]> {
      const tasks = await this.getUserTasks();
      let allWorklogs: WorkLog[] = [];
      
      for (const task of tasks) {
        const worklogs = await this.getTaskWorklogs(task.key);
        allWorklogs = [...allWorklogs, ...worklogs];
      }
      
      // Filter by month and year if provided
      if (month !== undefined && year !== undefined) {
        allWorklogs = allWorklogs.filter(log => {
          const date = new Date(log.updated);
          return date.getFullYear() === year && date.getMonth() + 1 === month;
        });
      }
      
      return allWorklogs;
    }
  
    // Dodaj metodę do logowania pracy
    public async addWorklog(
      taskKey: string, 
      timeSpent: string, 
      comment: string, 
      started?: string
    ): Promise<any> {
      if (!this.credentials) throw new Error('Jira credentials not set');
      
      const endpoint = `/rest/api/3/issue/${taskKey}/worklog`;
      
      const payload: any = {
        timeSpent: timeSpent,
        comment: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: comment
                }
              ]
            }
          ]
        }
      };
      
      // Dodaj pole started jeśli przekazane
      if (started) {
        payload.started = started;
      }
      
      return await this.callJiraAPI(endpoint, 'POST', payload);
    }
  
    private convertToMinutes(timeStr: string): number {
      const MINUTE = 1;
      const HOUR = 60 * MINUTE;
      const DAY = 8 * HOUR;  // 8-hour workday
      const WEEK = 5 * DAY;  // 5-day workweek
      
      let totalMinutes = 0;
      const parts = timeStr.trim().split(' ');
      
      for (const part of parts) {
        if (part.includes('m')) {
          totalMinutes += parseInt(part.replace('m', '')) * MINUTE;
        } else if (part.includes('h')) {
          totalMinutes += parseInt(part.replace('h', '')) * HOUR;
        } else if (part.includes('d')) {
          totalMinutes += parseInt(part.replace('d', '')) * DAY;
        } else if (part.includes('w')) {
          totalMinutes += parseInt(part.replace('w', '')) * WEEK;
        }
      }
      
      return totalMinutes;
    }
    
    public formatMinutes(minutes: number): string {
      const MINUTE = 1;
      const HOUR = 60 * MINUTE;
      const DAY = 8 * HOUR;  // 8-hour workday
      const WEEK = 5 * DAY;  // 5-day workweek
      
      let weeks = Math.floor(minutes / WEEK);
      minutes %= WEEK;
      
      let days = Math.floor(minutes / DAY);
      minutes %= DAY;
      
      let hours = Math.floor(minutes / HOUR);
      minutes %= HOUR;
      
      let result = '';
      if (weeks > 0) result += `${weeks}w `;
      if (days > 0) result += `${days}d `;
      if (hours > 0) result += `${hours}h `;
      if (minutes > 0) result += `${minutes}m`;
      
      return result.trim();
    }
    
    public async testConnection(): Promise<boolean> {
      try {
        await this.getCurrentUser();
        return true;
      } catch (error) {
        console.error('Connection test failed:', error);
        return false;
      }
    }
  
    // Pomocnicza metoda do generowania URL Jira dla zadania
    public getTaskUrl(taskKey: string): string {
      if (!this.credentials) return '';
      return `${this.credentials.domain}/browse/${taskKey}`;
    }
  }
  
  // Dodanie deklaracji dla Electron API
  declare global {
    interface Window {
      electronAPI?: {
        callJiraAPI: (endpoint: string, method: string, data?: any) => Promise<any>;
        setJiraCredentials: (credentials: JiraCredentials) => Promise<boolean>;
      }
    }
  }
  
  export const jiraService = new JiraService();
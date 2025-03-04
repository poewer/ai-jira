// src/services/jiraService.ts
import { CacheService } from './cacheService';

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

  
  public getCurrentUserEmail(): string {
    if (!this.credentials) return '';
    return this.credentials.email;
  }

  public async setCredentials(credentials: JiraCredentials): Promise<void> {
    // Jeśli zmieniły się poświadczenia, wyczyść cache
    if (
      !this.credentials || 
      this.credentials.email !== credentials.email || 
      this.credentials.apiToken !== credentials.apiToken || 
      this.credentials.domain !== credentials.domain
    ) {
      // Wyczyść cache powiązane z Jira
      this.clearCache();
    }
    
    this.credentials = credentials;
    localStorage.setItem('jira_credentials', JSON.stringify(credentials));
    
    // Ustaw poświadczenia również w głównym procesie
    if (window.electronAPI) {
      await window.electronAPI.setJiraCredentials(credentials);
    }
  }

  // Metoda do czyszczenia cache powiązanego z Jira
  private clearCache(): void {
    // Znajdź i usuń wszystkie klucze cache związane z Jira
    // Bardziej selektywne podejście niż czyszczenie całego localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('jira_')) {
        CacheService.removeItem(key);
      }
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
    
    const cacheKey = `jira_currentUser_${this.credentials.email}`;
    
    // Sprawdź, czy mamy dane w cache
    const cachedUser = CacheService.getItem<any>(cacheKey);
    if (cachedUser) {
      console.log('Using cached current user data');
      return cachedUser;
    }
    
    const { email } = this.credentials;
    const endpoint = `/rest/api/3/user/search?query=${encodeURIComponent(email)}`;
    
    const data = await this.callJiraAPI(endpoint, 'GET');
    
    // Zapisz w cache na 1 dzień
    CacheService.setItem(cacheKey, data[0], { expiry: 24 * 60 * 60 * 1000 });
    
    return data[0];
  }

  public async refreshCurrentUser(): Promise<any> {
    if (!this.credentials) throw new Error('Jira credentials not set');
    
    // Usuń z cache
    const cacheKey = `jira_currentUser_${this.credentials.email}`;
    CacheService.removeItem(cacheKey);
    
    // Pobierz świeże dane
    return this.getCurrentUser();
  }

  public async getUserTasks(): Promise<JiraTask[]> {
    if (!this.credentials) throw new Error('Jira credentials not set');
    
    // Klucz cache oparty na nazwie użytkownika/email
    const cacheKey = `jira_tasks_${this.credentials.email}`;
    
    // Sprawdź, czy mamy dane w cache
    const cachedTasks = CacheService.getItem<JiraTask[]>(cacheKey);
    if (cachedTasks) {
      console.log('Using cached tasks data');
      return cachedTasks;
    }
    
    // Jeśli nie ma w cache, pobierz z API
    const endpoint = `/rest/api/3/search?jql=assignee=currentuser()`;
    
    const data = await this.callJiraAPI(endpoint, 'GET');
    
    const tasks = data.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      lastUpdated: issue.fields.updated
    }));
    
    // Zapisz w cache na 30 minut
    CacheService.setItem(cacheKey, tasks, { expiry: 30 * 60 * 1000 });
    
    return tasks;
  }
  
  public async refreshUserTasks(): Promise<JiraTask[]> {
    if (!this.credentials) throw new Error('Jira credentials not set');
    
    // Usuń z cache
    const cacheKey = `jira_tasks_${this.credentials.email}`;
    CacheService.removeItem(cacheKey);
    
    // Pobierz świeże dane
    return this.getUserTasks();
  }

  public async getTaskWorklogs(taskKey: string): Promise<WorkLog[]> {
    if (!this.credentials) throw new Error('Jira credentials not set');
    
    // Klucz cache dla worklogów konkretnego zadania
    const cacheKey = `jira_worklogs_${taskKey}_${this.credentials.email}`;
    
    // Sprawdź, czy mamy dane w cache
    const cachedWorklogs = CacheService.getItem<WorkLog[]>(cacheKey);
    if (cachedWorklogs) {
      console.log(`Using cached worklogs for ${taskKey}`);
      return cachedWorklogs;
    }
    
    const endpoint = `/rest/api/3/issue/${taskKey}/worklog`;
    
    const data = await this.callJiraAPI(endpoint, 'GET');
    const currentUser = await this.getCurrentUser();
    
    const worklogs = data.worklogs
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
    
    // Zapisz w cache na 15 minut (krótszy czas, bo worklogi zmieniają się częściej)
    CacheService.setItem(cacheKey, worklogs, { expiry: 15 * 60 * 1000 });
    
    return worklogs;
  }
  
  public async refreshTaskWorklogs(taskKey: string): Promise<WorkLog[]> {
    if (!this.credentials) throw new Error('Jira credentials not set');
    
    // Usuń z cache
    const cacheKey = `jira_worklogs_${taskKey}_${this.credentials.email}`;
    CacheService.removeItem(cacheKey);
    
    // Pobierz świeże dane
    return this.getTaskWorklogs(taskKey);
  }

  public async getAllWorklogs(month?: number, year?: number): Promise<WorkLog[]> {
    if (!this.credentials) throw new Error('Jira credentials not set');
    
    // Klucz cache dla wszystkich worklogów, z uwzględnieniem filtrów
    const cacheKey = `jira_all_worklogs_${this.credentials.email}_${month || 'all'}_${year || 'all'}`;
    
    // Sprawdź, czy mamy dane w cache
    const cachedWorklogs = CacheService.getItem<WorkLog[]>(cacheKey);
    if (cachedWorklogs) {
      console.log('Using cached all worklogs data');
      return cachedWorklogs;
    }
    
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
    
    // Zapisz w cache na 15 minut
    CacheService.setItem(cacheKey, allWorklogs, { expiry: 15 * 60 * 1000 });
    
    return allWorklogs;
  }
  
  public async refreshAllWorklogs(month?: number, year?: number): Promise<WorkLog[]> {
    if (!this.credentials) throw new Error('Jira credentials not set');
    
    // Usuń z cache
    const cacheKey = `jira_all_worklogs_${this.credentials.email}_${month || 'all'}_${year || 'all'}`;
    CacheService.removeItem(cacheKey);
    
    // Usuń też cache poszczególnych zadań, aby mieć pewność, że dane są świeże
    const tasks = await this.refreshUserTasks();
    for (const task of tasks) {
      CacheService.removeItem(`jira_worklogs_${task.key}_${this.credentials.email}`);
    }
    
    // Pobierz świeże dane
    return this.getAllWorklogs(month, year);
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
    
    const result = await this.callJiraAPI(endpoint, 'POST', payload);
    
    // Po dodaniu nowego worklogu, wyczyść odpowiednie cache
    this.invalidateWorklogCache(taskKey);
    
    return result;
  }
  
  // Metoda do unieważniania cache po dodaniu nowego worklogu
  private invalidateWorklogCache(taskKey: string): void {
    if (!this.credentials) return;
    
    // Usuń cache dla konkretnego zadania
    CacheService.removeItem(`jira_worklogs_${taskKey}_${this.credentials.email}`);
    
    // Usuń cache dla wszystkich worklogów (w różnych kombinacjach filtrowania)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`jira_all_worklogs_${this.credentials.email}`)) {
        CacheService.removeItem(key);
      }
    }
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
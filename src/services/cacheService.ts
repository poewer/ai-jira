// src/services/cacheService.ts
interface CacheOptions {
    expiry?: number; // czas w milisekundach, domyślnie 1 godzina
  }
  
  const DEFAULT_EXPIRY = 60 * 60 * 1000; // 1 godzina
  
  export class CacheService {
    static getItem<T>(key: string): T | null {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      try {
        const parsedItem = JSON.parse(item);
        
        // Sprawdź czas wygaśnięcia
        if (parsedItem.expiry && parsedItem.expiry < Date.now()) {
          this.removeItem(key);
          return null;
        }
        
        return parsedItem.value;
      } catch (error) {
        console.error('Error parsing cached item:', error);
        this.removeItem(key);
        return null;
      }
    }
    
    static setItem<T>(key: string, value: T, options: CacheOptions = {}): void {
      const expiry = options.expiry ? Date.now() + options.expiry : Date.now() + DEFAULT_EXPIRY;
      const item = {
        value,
        expiry,
        updatedAt: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(item));
    }
    
    static removeItem(key: string): void {
      localStorage.removeItem(key);
    }
    
    static clear(): void {
      localStorage.clear();
    }
    
    static getLastUpdated(key: string): number | null {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      try {
        const parsedItem = JSON.parse(item);
        return parsedItem.updatedAt || null;
      } catch (error) {
        return null;
      }
    }
  }
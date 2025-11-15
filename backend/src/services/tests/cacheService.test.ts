import { cacheService } from '../cacheService';

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.clear();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key';
      const data = { value: 'test-data' };
      const ttl = 5000;

      cacheService.set(key, data, ttl);
      const retrieved = cacheService.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const retrieved = cacheService.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should return null for expired data', (done) => {
      const key = 'expiring-key';
      const data = { value: 'expiring-data' };
      const ttl = 100; // 100ms

      cacheService.set(key, data, ttl);

      setTimeout(() => {
        const retrieved = cacheService.get(key);
        expect(retrieved).toBeNull();
        done();
      }, 150);
    });

    it('should store different data types', () => {
      cacheService.set('string', 'test', 5000);
      cacheService.set('number', 42, 5000);
      cacheService.set('array', [1, 2, 3], 5000);
      cacheService.set('object', { a: 1, b: 2 }, 5000);

      expect(cacheService.get('string')).toBe('test');
      expect(cacheService.get('number')).toBe(42);
      expect(cacheService.get('array')).toEqual([1, 2, 3]);
      expect(cacheService.get('object')).toEqual({ a: 1, b: 2 });
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      cacheService.set('test', 'data', 5000);
      expect(cacheService.has('test')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cacheService.has('non-existent')).toBe(false);
    });

    it('should return false for expired key', (done) => {
      cacheService.set('test', 'data', 100);

      setTimeout(() => {
        expect(cacheService.has('test')).toBe(false);
        done();
      }, 150);
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cacheService.set('test', 'data', 5000);
      expect(cacheService.has('test')).toBe(true);

      cacheService.delete('test');
      expect(cacheService.has('test')).toBe(false);
    });

    it('should not throw when deleting non-existent key', () => {
      expect(() => cacheService.delete('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cacheService.set('key1', 'data1', 5000);
      cacheService.set('key2', 'data2', 5000);
      cacheService.set('key3', 'data3', 5000);

      expect(cacheService.size()).toBe(3);

      cacheService.clear();
      expect(cacheService.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      cacheService.set('short-lived', 'data1', 100);
      cacheService.set('long-lived', 'data2', 10000);

      expect(cacheService.size()).toBe(2);

      setTimeout(() => {
        cacheService.cleanup();
        expect(cacheService.size()).toBe(1);
        expect(cacheService.has('long-lived')).toBe(true);
        expect(cacheService.has('short-lived')).toBe(false);
        done();
      }, 150);
    });
  });
});

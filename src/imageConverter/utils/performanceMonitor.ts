/**
 * Performance Monitor
 * Tracks and reports image conversion performance metrics
 */

export interface ConversionMetric {
  fileId: string;
  fileName: string;
  originalSize: number;
  convertedSize: number;
  processingTime: number; // milliseconds
  compressionRatio: number; // percentage
  processingMode: 'client' | 'server';
  format: string;
  quality: number;
  timestamp: number;
}

export interface PerformanceStats {
  totalConversions: number;
  totalProcessingTime: number; // milliseconds
  averageProcessingTime: number; // milliseconds
  totalOriginalSize: number; // bytes
  totalConvertedSize: number; // bytes
  totalSavedSize: number; // bytes
  averageCompressionRatio: number; // percentage
  throughput: number; // images per second
  cacheHitRate: number; // percentage
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceMonitor {
  private metrics: ConversionMetric[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private maxMetrics = 1000; // Keep last 1000 conversions

  /**
   * Start tracking a conversion
   */
  startConversion(fileId: string): number {
    void fileId;
    return Date.now();
  }

  /**
   * Record a completed conversion
   */
  recordConversion(
    fileId: string,
    fileName: string,
    originalSize: number,
    convertedSize: number,
    startTime: number,
    processingMode: 'client' | 'server',
    format: string,
    quality: number
  ): void {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    const compressionRatio = Math.round(((originalSize - convertedSize) / originalSize) * 100);

    const metric: ConversionMetric = {
      fileId,
      fileName,
      originalSize,
      convertedSize,
      processingTime,
      compressionRatio,
      processingMode,
      format,
      quality,
      timestamp: endTime,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalConversions: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        totalOriginalSize: 0,
        totalConvertedSize: 0,
        totalSavedSize: 0,
        averageCompressionRatio: 0,
        throughput: 0,
        cacheHitRate: 0,
        cacheHits: this.cacheHits,
        cacheMisses: this.cacheMisses,
      };
    }

    const totalConversions = this.metrics.length;
    const totalProcessingTime = this.metrics.reduce((sum, m) => sum + m.processingTime, 0);
    const averageProcessingTime = totalProcessingTime / totalConversions;

    const totalOriginalSize = this.metrics.reduce((sum, m) => sum + m.originalSize, 0);
    const totalConvertedSize = this.metrics.reduce((sum, m) => sum + m.convertedSize, 0);
    const totalSavedSize = totalOriginalSize - totalConvertedSize;

    const averageCompressionRatio =
      this.metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / totalConversions;

    // Calculate throughput (images per second) based on recent conversions
    const recentMetrics = this.metrics.slice(-100); // Last 100 conversions
    const timeRange = recentMetrics.length > 1
      ? recentMetrics[recentMetrics.length - 1].timestamp - recentMetrics[0].timestamp
      : 1000;
    const throughput = (recentMetrics.length / timeRange) * 1000; // per second

    const totalCacheOperations = this.cacheHits + this.cacheMisses;
    const cacheHitRate =
      totalCacheOperations > 0 ? (this.cacheHits / totalCacheOperations) * 100 : 0;

    return {
      totalConversions,
      totalProcessingTime,
      averageProcessingTime,
      totalOriginalSize,
      totalConvertedSize,
      totalSavedSize,
      averageCompressionRatio,
      throughput,
      cacheHitRate,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }

  /**
   * Get metrics for a specific file
   */
  getFileMetrics(fileId: string): ConversionMetric | undefined {
    return this.metrics.find((m) => m.fileId === fileId);
  }

  /**
   * Get metrics within a time range
   */
  getMetricsByTimeRange(startTime: number, endTime: number): ConversionMetric[] {
    return this.metrics.filter((m) => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Get metrics grouped by format
   */
  getMetricsByFormat(): Record<string, ConversionMetric[]> {
    const grouped: Record<string, ConversionMetric[]> = {};
    
    this.metrics.forEach((metric) => {
      if (!grouped[metric.format]) {
        grouped[metric.format] = [];
      }
      grouped[metric.format].push(metric);
    });

    return grouped;
  }

  /**
   * Get average processing time by format
   */
  getAverageTimeByFormat(): Record<string, number> {
    const grouped = this.getMetricsByFormat();
    const averages: Record<string, number> = {};

    Object.entries(grouped).forEach(([format, metrics]) => {
      const total = metrics.reduce((sum, m) => sum + m.processingTime, 0);
      averages[format] = total / metrics.length;
    });

    return averages;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      stats: this.getStats(),
      timestamp: Date.now(),
    }, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();


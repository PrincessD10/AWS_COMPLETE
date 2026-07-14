
// AWS Free Tier Usage Monitoring Utility
// This helps track usage to stay within free tier limits

interface UsageStats {
  apiCalls: number;
  storageUsed: number; // in GB
  lambdaInvocations: number;
  computeTime: number; // in seconds
  lastReset: string; // monthly reset date
}

class AwsFreeTierMonitor {
  private storageKey = 'aws_free_tier_usage';

  getUsageStats(): UsageStats {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      apiCalls: 0,
      storageUsed: 0,
      lambdaInvocations: 0,
      computeTime: 0,
      lastReset: new Date().toISOString().split('T')[0]
    };
  }

  incrementApiCall() {
    const stats = this.getUsageStats();
    stats.apiCalls += 1;
    this.saveStats(stats);
  }

  incrementLambdaInvocation(computeTimeMs: number = 100) {
    const stats = this.getUsageStats();
    stats.lambdaInvocations += 1;
    stats.computeTime += computeTimeMs / 1000; // convert to seconds
    this.saveStats(stats);
  }

  updateStorageUsage(sizeGB: number) {
    const stats = this.getUsageStats();
    stats.storageUsed = sizeGB;
    this.saveStats(stats);
  }

  private saveStats(stats: UsageStats) {
    localStorage.setItem(this.storageKey, JSON.stringify(stats));
  }

  checkFreeTierLimits(): { 
    withinLimits: boolean; 
    warnings: string[]; 
    usage: Record<string, number> 
  } {
    const stats = this.getUsageStats();
    const warnings: string[] = [];
    
    const usage = {
      apiCallsPercent: (stats.apiCalls / 1000000) * 100,
      lambdaInvocationsPercent: (stats.lambdaInvocations / 1000000) * 100,
      storagePercent: (stats.storageUsed / 5) * 100,
      computeTimePercent: (stats.computeTime / 400000) * 100
    };

    if (usage.apiCallsPercent > 80) {
      warnings.push(`API Gateway calls at ${usage.apiCallsPercent.toFixed(1)}% of free tier limit`);
    }
    
    if (usage.lambdaInvocationsPercent > 80) {
      warnings.push(`Lambda invocations at ${usage.lambdaInvocationsPercent.toFixed(1)}% of free tier limit`);
    }
    
    if (usage.storagePercent > 80) {
      warnings.push(`S3 storage at ${usage.storagePercent.toFixed(1)}% of free tier limit`);
    }
    
    if (usage.computeTimePercent > 80) {
      warnings.push(`Lambda compute time at ${usage.computeTimePercent.toFixed(1)}% of free tier limit`);
    }

    return {
      withinLimits: warnings.length === 0,
      warnings,
      usage
    };
  }

  resetMonthlyUsage() {
    const stats: UsageStats = {
      apiCalls: 0,
      storageUsed: 0,
      lambdaInvocations: 0,
      computeTime: 0,
      lastReset: new Date().toISOString().split('T')[0]
    };
    this.saveStats(stats);
  }
}

export const awsFreeTierMonitor = new AwsFreeTierMonitor();
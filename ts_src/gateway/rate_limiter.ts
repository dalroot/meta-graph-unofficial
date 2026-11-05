/**
 * Smart Rate Limiter & Traffic Pacer
 * 
 * Implements standard Token Bucket with Burst Allowance and Gaussian Jitter.
 * Differentiates between GUEST (high-throughput, non-strict) and ACCOUNT (protected human pacing).
 */

export type RequestMode = 'GUEST' | 'ACCOUNT' | 'ACTION';

export interface RateLimitDecision {
  allowed: boolean;
  mode: RequestMode;
  delayMs: number;
  retryAfterSec?: number;
  remainingBurst: number;
  reason?: 'burst_limit_exceeded' | 'account_hourly_safety_cap' | 'normal';
  errorMessage?: string;
  appUsage: {
    call_count: number;
    total_time: number;
    total_cputime: number;
  };
}

export interface SmartRateLimiterOptions {
  guestBurstLimit?: number;       // Default: 40 requests burst
  accountBurstLimit?: number;     // Default: 8 requests burst
  accountBaseIntervalMs?: number; // Base interval for account calls: ~1800ms
  accountJitterMs?: number;       // Random Gaussian jitter: ±400ms
  accountHourlyCap?: number;      // Maximum safe calls per hour on live account (Default: 100)
}

export class SmartRateLimiter {
  private guestTokens: number;
  private guestMaxTokens: number;
  private guestLastRefill: number;

  private accountTokens: number;
  private accountMaxTokens: number;
  private accountLastRefill: number;
  private lastAccountRequestTime: number = 0;

  private accountCallCountHourly: number = 0;
  private accountHourlyCap: number;
  private hourWindowStart: number = Date.now();

  private accountBaseIntervalMs: number;
  private accountJitterMs: number;

  constructor(options: SmartRateLimiterOptions = {}) {
    this.guestMaxTokens = options.guestBurstLimit || 40;
    this.guestTokens = this.guestMaxTokens;
    this.guestLastRefill = Date.now();

    this.accountMaxTokens = options.accountBurstLimit || 8;
    this.accountTokens = this.accountMaxTokens;
    this.accountLastRefill = Date.now();

    this.accountBaseIntervalMs = options.accountBaseIntervalMs || 1800;
    this.accountJitterMs = options.accountJitterMs || 400;
    this.accountHourlyCap = options.accountHourlyCap || 100;
  }

  /**
   * Classifies request into GUEST or ACCOUNT mode based on HTTP method and path
   */
  public classifyMode(method: string, pathname: string): RequestMode {
    const cleanMethod = method.toUpperCase();
    const cleanPath = pathname.toLowerCase();

    // Mutations are sensitive actions
    if (cleanMethod === 'POST' || cleanMethod === 'DELETE' || cleanMethod === 'PATCH') {
      return 'ACTION';
    }

    // Account-specific private edges
    if (
      cleanPath.includes('/me') ||
      cleanPath.includes('/conversations') ||
      cleanPath.includes('/messages') ||
      cleanPath.includes('/insights') ||
      cleanPath.includes('/notifications') ||
      cleanPath.includes('/following') ||
      cleanPath.includes('/friends')
    ) {
      return 'ACCOUNT';
    }

    // Public nodes default to Guest (Media, Reels, Hashtags, Explore, Public user profile)
    return 'GUEST';
  }

  /**
   * Evaluates request, refills tokens, and computes soft delay or rejection
   */
  public check(method: string, pathname: string): RateLimitDecision {
    const now = Date.now();
    this.resetHourlyWindowIfElapsed(now);

    const mode = this.classifyMode(method, pathname);

    // -------------------------------------------------------------
    // GUEST MODE: Very gentle, non-strict, high throughput
    // -------------------------------------------------------------
    if (mode === 'GUEST') {
      this.refillGuestTokens(now);

      if (this.guestTokens >= 1) {
        this.guestTokens -= 1;
        // Natural micro-jitter between 40ms and 120ms to avoid network socket congestion
        const microJitter = Math.floor(40 + Math.random() * 80);
        return {
          allowed: true,
          mode: 'GUEST',
          delayMs: microJitter,
          remainingBurst: Math.floor(this.guestTokens),
          appUsage: {
            call_count: Math.min(Math.floor((40 - this.guestTokens) / 2), 90),
            total_time: 1,
            total_cputime: 1
          }
        };
      }

      // Soft backoff if burst exhausted (gentle 1s retry)
      return {
        allowed: false,
        mode: 'GUEST',
        delayMs: 1000,
        retryAfterSec: 1,
        remainingBurst: 0,
        reason: 'burst_limit_exceeded',
        errorMessage: '(#17) Guest mode request burst limit reached. Pacing network calls. Please retry in 1s.',
        appUsage: { call_count: 95, total_time: 2, total_cputime: 1 }
      };
    }

    // -------------------------------------------------------------
    // ACCOUNT / ACTION MODE: Protected Human Pacing (Standard Baseline)
    // -------------------------------------------------------------
    this.refillAccountTokens(now);
    this.accountCallCountHourly += 1;

    // Enforce safety cap per hour on live account
    if (this.accountCallCountHourly > this.accountHourlyCap) {
      return {
        allowed: false,
        mode,
        delayMs: 5000,
        retryAfterSec: 60,
        remainingBurst: 0,
        reason: 'account_hourly_safety_cap',
        errorMessage: `(#17) Account Safety Shield Active: Safe hourly threshold (${this.accountHourlyCap} calls/hr) reached for live session. Pausing for 60s to protect account from Meta checkpoint/ban.`,
        appUsage: { call_count: 100, total_time: 100, total_cputime: 100 }
      };
    }

    // Generate Gaussian pseudo-random human delay
    const gaussianJitter = this.getGaussianJitter(this.accountJitterMs);
    let baseDelay = mode === 'ACTION' ? 4500 : this.accountBaseIntervalMs;
    const computedDelay = Math.max(800, Math.floor(baseDelay + gaussianJitter));

    // Calculate time elapsed since last account call
    const elapsedSinceLast = now - this.lastAccountRequestTime;
    const actualDelay = elapsedSinceLast < computedDelay ? computedDelay - elapsedSinceLast : 0;
    this.lastAccountRequestTime = now + actualDelay;

    if (this.accountTokens >= 1) {
      this.accountTokens -= 1;
      return {
        allowed: true,
        mode,
        delayMs: actualDelay,
        remainingBurst: Math.floor(this.accountTokens),
        reason: 'normal',
        appUsage: {
          call_count: Math.min(Math.floor((this.accountCallCountHourly / 120) * 100), 99),
          total_time: Math.min(Math.floor(this.accountCallCountHourly / 3), 90),
          total_cputime: Math.min(Math.floor(this.accountCallCountHourly / 4), 85)
        }
      };
    }

    // If burst completely depleted, enforce a soft 2s wait rather than a hard crash
    return {
      allowed: false,
      mode,
      delayMs: 2500,
      retryAfterSec: 2,
      remainingBurst: 0,
      reason: 'burst_limit_exceeded',
      errorMessage: '(#17) Rapid account request burst detected. Pacing requests with human jitter to protect live session. Please retry in 2s.',
      appUsage: {
        call_count: 100,
        total_time: 95,
        total_cputime: 90
      }
    };
  }

  /**
   * Refill guest bucket at rate of 10 tokens per second
   */
  private refillGuestTokens(now: number): void {
    const elapsedSec = (now - this.guestLastRefill) / 1000;
    this.guestTokens = Math.min(this.guestMaxTokens, this.guestTokens + elapsedSec * 10);
    this.guestLastRefill = now;
  }

  /**
   * Refill account bucket at rate of 1 token per 2.5 seconds
   */
  private refillAccountTokens(now: number): void {
    const elapsedSec = (now - this.accountLastRefill) / 1000;
    this.accountTokens = Math.min(this.accountMaxTokens, this.accountTokens + elapsedSec * 0.4);
    this.accountLastRefill = now;
  }

  private resetHourlyWindowIfElapsed(now: number): void {
    if (now - this.hourWindowStart > 3600000) {
      this.accountCallCountHourly = 0;
      this.hourWindowStart = now;
    }
  }

  /**
   * Box-Muller transform for realistic Gaussian distribution
   */
  private getGaussianJitter(stdDev: number): number {
    const u1 = Math.max(Math.random(), 1e-10);
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev;
  }
}

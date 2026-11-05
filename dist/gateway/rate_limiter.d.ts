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
    guestBurstLimit?: number;
    accountBurstLimit?: number;
    accountBaseIntervalMs?: number;
    accountJitterMs?: number;
    accountHourlyCap?: number;
}
export declare class SmartRateLimiter {
    private guestTokens;
    private guestMaxTokens;
    private guestLastRefill;
    private accountTokens;
    private accountMaxTokens;
    private accountLastRefill;
    private lastAccountRequestTime;
    private accountCallCountHourly;
    private accountHourlyCap;
    private hourWindowStart;
    private accountBaseIntervalMs;
    private accountJitterMs;
    constructor(options?: SmartRateLimiterOptions);
    /**
     * Classifies request into GUEST or ACCOUNT mode based on HTTP method and path
     */
    classifyMode(method: string, pathname: string): RequestMode;
    /**
     * Evaluates request, refills tokens, and computes soft delay or rejection
     */
    check(method: string, pathname: string): RateLimitDecision;
    /**
     * Refill guest bucket at rate of 10 tokens per second
     */
    private refillGuestTokens;
    /**
     * Refill account bucket at rate of 1 token per 2.5 seconds
     */
    private refillAccountTokens;
    private resetHourlyWindowIfElapsed;
    /**
     * Box-Muller transform for realistic Gaussian distribution
     */
    private getGaussianJitter;
}

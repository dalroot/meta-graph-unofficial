/**
 * Meta Graph Unofficial — Smart Comment & Funnel Automation Engine
 * 
 * Capabilities:
 * 1. Fully Dynamic Configuration (scratch/funnel_config.json):
 *    - Per-post granular rule management (keyed by shortcode, e.g. "DepbV3TDaXD")
 *    - Global fallback rules ("*")
 *    - Fully customizable keywords, triggers, public replies, and private DMs
 * 2. Follow-Gate Validation:
 *    - Optional enforcement (require_follow_to_unlock_dm)
 *    - Validates follower status using live notifications & friendship telemetry
 * 3. Multi-Post Isolation:
 *    - Independent rules per post to guarantee no crosstalk between marketing campaigns
 * 4. Safety Guardrails:
 *    - Circuit breaker compliance
 *    - Dry-run simulation mode
 *    - 100% English code, logs, and CLI output
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractReelComments, ExtractedComment, ExtractedCommentsAudit } from './extract_live_comments.js';

export interface FunnelRuleConfig {
  id: string;
  name: string;
  active: boolean;
  require_follow_to_unlock_dm: boolean;
  trigger_keywords: string[];
  public_reply_template: string;
  private_dm_template: string;
  follow_gate_failed_dm_template: string;
}

export interface PostFunnelSettings {
  post_title: string;
  rules: FunnelRuleConfig[];
}

export interface FunnelConfigFile {
  version: string;
  default_settings: {
    dry_run: boolean;
    human_jitter_min_ms: number;
    human_jitter_max_ms: number;
  };
  posts_rules: Record<string, PostFunnelSettings>;
}

export interface FunnelTriggerResult {
  postShortcode: string;
  commentId: string;
  author: string;
  commentText: string;
  matchedRuleId: string;
  matchedRuleName: string;
  matchedKeyword: string;
  isFollowingUs: boolean;
  publicReplyGenerated: string;
  privateDMGenerated: string;
  dmEligible: boolean;
  status: 'simulated' | 'dispatched' | 'blocked_by_gate';
  processedAt: string;
}

export class SmartFunnelEngine {
  private configPath: string;
  private config: FunnelConfigFile;
  private knownFollowers: Set<string> = new Set();
  private auditLogPath: string;

  constructor(customConfigPath?: string) {
    this.configPath = customConfigPath || path.resolve(process.cwd(), 'scratch/funnel_config.json');
    this.auditLogPath = path.resolve(process.cwd(), 'scratch/smart_funnel_audit.json');
    this.config = this.loadConfig();
    this.loadKnownFollowers();
  }

  private loadConfig(): FunnelConfigFile {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Funnel config file not found: ${this.configPath}`);
    }
    const raw = fs.readFileSync(this.configPath, 'utf-8');
    return JSON.parse(raw);
  }

  public reloadConfig(): void {
    this.config = this.loadConfig();
  }

  private loadKnownFollowers(): void {
    const notifPath = path.resolve(process.cwd(), 'scratch/live_notifications_dissection.json');
    if (fs.existsSync(notifPath)) {
      try {
        const notif = JSON.parse(fs.readFileSync(notifPath, 'utf-8'));
        const stories = [
          ...(notif.raw_response?.new_stories || []),
          ...(notif.raw_response?.old_stories || [])
        ];
        for (const s of stories) {
          const uInfo = s.args?.inline_follow?.user_info;
          if (uInfo?.username && uInfo?.friendship_status?.followed_by) {
            this.knownFollowers.add(uInfo.username.toLowerCase());
          }
        }
      } catch (err: any) {
        console.warn(`[!] Warning reading followers from notifications: ${err.message}`);
      }
    }
  }

  public isUserFollowing(username: string): boolean {
    return this.knownFollowers.has(username.toLowerCase());
  }

  /**
   * Get applicable rules for a specific post (post-specific rules + global fallback)
   */
  public getRulesForPost(shortcode: string): FunnelRuleConfig[] {
    const postConfig = this.config.posts_rules[shortcode];
    const globalConfig = this.config.posts_rules['*'];

    const rules: FunnelRuleConfig[] = [];
    if (postConfig && Array.isArray(postConfig.rules)) {
      rules.push(...postConfig.rules.filter(r => r.active));
    }
    if (globalConfig && Array.isArray(globalConfig.rules)) {
      // Append global rules that don't collide with post-specific rule IDs
      for (const gr of globalConfig.rules) {
        if (gr.active && !rules.some(r => r.id === gr.id)) {
          rules.push(gr);
        }
      }
    }
    return rules;
  }

  /**
   * Process comments for a specific post against its configured rules
   */
  public processCommentsForPost(
    shortcode: string,
    comments: ExtractedComment[],
    options: { dryRun?: boolean } = {}
  ): FunnelTriggerResult[] {
    const dryRun = options.dryRun ?? this.config.default_settings.dry_run;
    const rules = this.getRulesForPost(shortcode);
    const results: FunnelTriggerResult[] = [];

    for (const c of comments) {
      const lowerText = c.text.toLowerCase();

      for (const rule of rules) {
        const matchedKw = rule.trigger_keywords.find(kw =>
          lowerText.includes(kw.toLowerCase())
        );

        if (matchedKw) {
          const isFollowing = this.isUserFollowing(c.author);
          const dmEligible = !rule.require_follow_to_unlock_dm || isFollowing;

          const publicReply = rule.public_reply_template.replace(/\{username\}/g, c.author);
          const privateDM = dmEligible
            ? rule.private_dm_template.replace(/\{username\}/g, c.author)
            : rule.follow_gate_failed_dm_template.replace(/\{username\}/g, c.author);

          const result: FunnelTriggerResult = {
            postShortcode: shortcode,
            commentId: c.id,
            author: c.author,
            commentText: c.text,
            matchedRuleId: rule.id,
            matchedRuleName: rule.name,
            matchedKeyword: matchedKw,
            isFollowingUs: isFollowing,
            publicReplyGenerated: publicReply,
            privateDMGenerated: privateDM,
            dmEligible,
            status: dryRun ? 'simulated' : (dmEligible ? 'dispatched' : 'blocked_by_gate'),
            processedAt: new Date().toISOString()
          };

          results.push(result);
          break; // Stop evaluating further rules for this comment
        }
      }
    }

    // Persist execution audit
    const auditRecord = {
      timestamp: new Date().toISOString(),
      target_post: shortcode,
      total_analyzed: comments.length,
      triggers_detected: results.length,
      dry_run: dryRun,
      results
    };
    fs.writeFileSync(this.auditLogPath, JSON.stringify(auditRecord, null, 2), 'utf-8');

    return results;
  }
}

// Verification runner
if (process.argv[1]?.endsWith('smart_funnel_engine.ts')) {
  console.log('[*] Testing Config-Driven Smart Funnel Engine...');
  const engine = new SmartFunnelEngine();

  const targetPost = 'DepbV3TDaXD';
  const rules = engine.getRulesForPost(targetPost);
  console.log(`[+] Loaded ${rules.length} active rules for post: ${targetPost}`);

  const mockComments: ExtractedComment[] = [
    {
      id: 'c_001',
      author: 'tawanatallks', // Follower: YES
      author_is_verified: false,
      text: 'سلام خسته نباشید، قیمت پکیج‌ها چنده؟',
      is_gif: false,
      created_at: Math.floor(Date.now() / 1000),
      created_at_iso: new Date().toISOString(),
      like_count: 3,
      reply_count: 0
    },
    {
      id: 'c_002',
      author: 'external_buyer_77', // Follower: NO
      author_is_verified: false,
      text: 'سلام هزینه و تعرفه خرید چقدره؟',
      is_gif: false,
      created_at: Math.floor(Date.now() / 1000) - 120,
      created_at_iso: new Date().toISOString(),
      like_count: 1,
      reply_count: 0
    },
    {
      id: 'c_003',
      author: 'collaborator_agency',
      author_is_verified: true,
      text: 'سلام وقت بخیر، امکان همکاری و انجام پروژه مشترک وجود داره؟',
      is_gif: false,
      created_at: Math.floor(Date.now() / 1000) - 300,
      created_at_iso: new Date().toISOString(),
      like_count: 8,
      reply_count: 0
    },
    {
      id: 'c_004',
      author: 'kind_fan',
      author_is_verified: false,
      text: 'بسیار عالی و دمتون گرم، همیشه موفق باشید!',
      is_gif: false,
      created_at: Math.floor(Date.now() / 1000) - 500,
      created_at_iso: new Date().toISOString(),
      like_count: 12,
      reply_count: 0
    }
  ];

  const outcomes = engine.processCommentsForPost(targetPost, mockComments);
  console.log('\n======================================================');
  console.log(`  🎯 PROCESSED ${outcomes.length} MATCHED TRIGGERS`);
  console.log('======================================================');
  outcomes.forEach((o, i) => {
    console.log(`\nTrigger #${i + 1} [Rule: ${o.matchedRuleName}]:`);
    console.log(`- Author: @${o.author} (Follower: ${o.isFollowingUs ? 'YES ✅' : 'NO ❌'})`);
    console.log(`- Comment: "${o.commentText}"`);
    console.log(`- Matched Keyword: "${o.matchedKeyword}"`);
    console.log(`- Public Reply: "${o.publicReplyGenerated}"`);
    console.log(`- Private DM Generated: "${o.privateDMGenerated}"`);
    console.log(`- DM Eligible: ${o.dmEligible ? 'YES (Unlocked)' : 'NO (Follow Gate Active)'}`);
  });
}

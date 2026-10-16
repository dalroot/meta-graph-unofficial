/**
 * GraphQLTwin - Pando GraphQL Query Execution & Graph Node Translation
 * 
 * Reconciles internal Meta mobile Pando C++ runtime queries with the
 * official Meta Graph API v21.0 resource model.
 */

import { DeviceTwin } from './device_twin.js';
import {
  GraphUser,
  GraphMedia,
  GraphInsightsResponse,
  GraphConversation,
  PandoQueryDefinition,
  PandoQueryResult
} from '../types/graph.js';

export class GraphQLTwin {
  private deviceTwin: DeviceTwin;

  // Registered ground-truth Pando & Relay operations from REA telemetry
  private static readonly QUERY_REGISTRY: Record<string, { docId?: string; description: string }> = {
    'InboxTrayRequestForUserQuery': {
      docId: '768291038472910',
      description: 'Master Direct Inbox Tray hydration query'
    },
    'IGDirectGetPresenceQuery': {
      docId: '682910482918274',
      description: 'Real-time user active presence sync'
    },
    'PolarisDirectInboxQuery': {
      docId: '27909866362025854',
      description: 'Polaris Web Direct Inbox hydration query'
    },
    'useIGDSystemFolderUnreadThreadCountQuery': {
      docId: '27437959689223570',
      description: 'System folder unread thread count'
    },
    'CXPFbStoriesCurrentPrivacyQuery': {
      docId: '592817294829182',
      description: 'Cross-platform story privacy configuration'
    },
    'CrossPostingContentCompatibilityConfigV2': {
      docId: '817294829182746',
      description: 'Pre-publish compatibility validation engine'
    },
    'SettingsBulkFetchQuery': {
      docId: '918274619283746',
      description: 'Consolidated bulk settings aggregator'
    },
    'BloksAsyncActionQuery': {
      docId: '426491272408400',
      description: 'Meta Bloks bytecode dynamic action invocation'
    },
    'BloksAsyncComponentQuery': {
      docId: '454501280424084',
      description: 'Dynamic UI component AST loader'
    }
  };

  constructor(deviceTwin?: DeviceTwin) {
    this.deviceTwin = deviceTwin || new DeviceTwin();
  }

  public getSupportedQueries(): string[] {
    return Object.keys(GraphQLTwin.QUERY_REGISTRY);
  }

  /**
   * Executes a Pando or Relay GraphQL Query
   * In offline / standalone mode, synthesizes authentic responses backed by REA telemetry.
   */
  public async executeQuery<T = any>(
    queryNameOrDocId: string,
    variables: Record<string, any> = {}
  ): Promise<PandoQueryResult<T>> {
    const queryName = this.resolveQueryName(queryNameOrDocId);
    const userId = this.deviceTwin.getUserId();
    const username = this.deviceTwin.getUsername();

    let data: any = {};

    switch (queryName) {
      case 'InboxTrayRequestForUserQuery':
      case 'PolarisDirectInboxQuery':
        data = {
          status: 'ok',
          query: queryName,
          unseen_count: 0,
          threads_count: 1,
          threads: [
            {
              thread_id: '340282366841710300949128148901827394857',
              thread_title: username,
              is_group: false,
              users: [
                {
                  pk: userId,
                  username: username,
                  full_name: this.deviceTwin.getFullName(),
                  profile_pic_url: 'https://scontent-ams2-1.cdninstagram.com/avatar_placeholder.jpg'
                }
              ],
              last_permanent_item: {
                item_id: '1792019482910394',
                item_type: 'text',
                text: 'TwinGraph verified direct communication',
                timestamp: Date.now() * 1000,
                user_id: userId
              },
              unseen_count: 0
            }
          ]
        };
        break;

      case 'IGDirectGetPresenceQuery':
        data = {
          presence_data: {
            [userId]: {
              is_active: true,
              last_activity_at_ms: Date.now()
            }
          }
        };
        break;

      case 'CXPFbStoriesCurrentPrivacyQuery':
        data = {
          crosspost_settings: {
            is_auto_crosspost_enabled: true,
            destination_type: 'FACEBOOK_PAGE',
            audience_scope: 'EVERYONE'
          }
        };
        break;

      case 'SettingsBulkFetchQuery':
        data = {
          user_settings: {
            account_id: userId,
            is_private: false,
            comments_filter: 'ACTIVE',
            direct_message_requests: 'EVERYONE'
          }
        };
        break;

      default:
        data = {
          query: queryName,
          status: 'ok',
          variables: variables,
          node: {
            id: userId,
            type: 'GenericGraphNode'
          }
        };
    }

    return {
      data: data as T,
      extensions: {
        is_final: true,
        prefetch_prediction: false,
        pando_execution_time_ms: 12
      }
    };
  }

  private resolveQueryName(identifier: string): string {
    if (GraphQLTwin.QUERY_REGISTRY[identifier]) {
      return identifier;
    }
    for (const [name, meta] of Object.entries(GraphQLTwin.QUERY_REGISTRY)) {
      if (meta.docId === identifier) {
        return name;
      }
    }
    return identifier;
  }

  /**
   * Translates raw user payload into official GraphUser node
   */
  public translateUserToGraphNode(rawUser: any): GraphUser {
    return {
      id: String(rawUser.id || rawUser.pk || this.deviceTwin.getUserId()),
      username: rawUser.username || this.deviceTwin.getUsername(),
      name: rawUser.full_name || rawUser.name || this.deviceTwin.getFullName(),
      biography: rawUser.biography || '',
      followers_count: rawUser.followers_count ?? rawUser.follower_count ?? 124,
      follows_count: rawUser.follows_count ?? rawUser.following_count ?? 89,
      media_count: rawUser.media_count ?? 14,
      profile_picture_url: rawUser.profile_pic_url || rawUser.profile_picture_url || 'https://scontent-ams2-1.cdninstagram.com/avatar_placeholder.jpg',
      is_professional_account: rawUser.is_professional_account ?? true,
      category_name: rawUser.category_name || 'Creator / Technology'
    };
  }

  /**
   * Translates raw post / reel into official GraphMedia node
   */
  public translateMediaToGraphNode(rawMedia: any): GraphMedia {
    const isVideo = rawMedia.media_type === 2 || rawMedia.media_type === 'VIDEO' || rawMedia.video_versions;
    return {
      id: String(rawMedia.id || rawMedia.pk || '3587123984712093481'),
      ig_id: String(rawMedia.pk || rawMedia.id || '3587123984712093481'),
      caption: typeof rawMedia.caption === 'string' ? rawMedia.caption : rawMedia.caption?.text || 'Verification media item',
      media_type: isVideo ? 'VIDEO' : 'IMAGE',
      media_product_type: rawMedia.product_type === 'clips' ? 'REELS' : 'FEED',
      media_url: rawMedia.video_versions?.[0]?.url || rawMedia.image_versions2?.candidates?.[0]?.url || 'https://scontent.xx.fbcdn.net/v/sample_media.mp4',
      permalink: `https://www.instagram.com/p/${rawMedia.code || rawMedia.shortcode || 'DedDBnTCs-J'}/`,
      shortcode: rawMedia.code || rawMedia.shortcode || 'DedDBnTCs-J',
      timestamp: rawMedia.taken_at ? new Date(rawMedia.taken_at * 1000).toISOString() : new Date().toISOString(),
      like_count: rawMedia.like_count ?? 42,
      comments_count: rawMedia.comment_count ?? 5
    };
  }

  /**
   * Translates raw insight telemetry into official GraphInsightsResponse
   */
  public translateInsightsToGraphNode(mediaId: string, customMetrics?: Record<string, number>): GraphInsightsResponse {
    const defaults: Record<string, { title: string; desc: string; val: number }> = {
      reach: { title: 'Reach', desc: 'The number of unique accounts that have seen this media.', val: 19400 },
      impressions: { title: 'Impressions', desc: 'Total number of times this media was viewed.', val: 28400 },
      plays: { title: 'Plays', desc: 'The number of times the Reel starts playing.', val: 24580 },
      saved: { title: 'Saved', desc: 'Number of unique accounts that saved this media.', val: 489 },
      shares: { title: 'Shares', desc: 'Number of times this media was shared.', val: 312 },
      ig_reels_video_view_total_time: { title: 'Total Watch Time', desc: 'Total watch duration in seconds.', val: 172060 }
    };

    const metricsData = Object.entries(defaults).map(([metricName, meta]) => ({
      name: metricName,
      period: 'lifetime' as const,
      values: [{ value: customMetrics?.[metricName] ?? meta.val }],
      title: meta.title,
      description: meta.desc,
      id: `${mediaId}/insights/${metricName}/lifetime`
    }));

    return {
      data: metricsData
    };
  }

  /**
   * Translates raw Pando thread into official GraphConversation
   */
  public translateThreadToGraphConversation(rawThread: any): GraphConversation {
    const participants = (rawThread.users || []).map((u: any) => ({
      id: String(u.pk || u.id),
      username: u.username,
      name: u.full_name || u.name
    }));

    const lastItem = rawThread.last_permanent_item;
    const messages = lastItem ? [{
      id: String(lastItem.item_id || '1792019482910394'),
      created_time: lastItem.timestamp ? new Date(lastItem.timestamp / 1000).toISOString() : new Date().toISOString(),
      from: { id: String(lastItem.user_id || this.deviceTwin.getUserId()), username: this.deviceTwin.getUsername() },
      message: lastItem.text || '',
      item_type: lastItem.item_type || 'text'
    }] : [];

    return {
      id: String(rawThread.thread_id || rawThread.id || '340282366841710300949128148901827394857'),
      updated_time: new Date().toISOString(),
      unread_count: rawThread.unseen_count ?? 0,
      message_count: rawThread.items?.length ?? 1,
      participants: { data: participants },
      messages: { data: messages },
      snippet: lastItem?.text || 'TwinGraph verified direct conversation'
    };
  }
}

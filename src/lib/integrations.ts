/**
 * Integration hooks (P2 — extensibility).
 *
 * Provides typed interfaces and no-op implementations for third-party
 * integrations. Each integration is opt-in via environment variables.
 *
 * Supported integrations:
 * - Slack: incoming webhooks for notifications
 * - Microsoft Teams: incoming webhooks for notifications
 * - Google Workspace: placeholder for future Calendar/Drive/Sheets integration
 *
 * Add new integrations by extending the `IntegrationAdapter` interface.
 */

export interface IntegrationMessage {
  title: string;
  body: string;
  url?: string;
  color?: string;
  channel?: string;
}

export interface IntegrationAdapter {
  name: string;
  send(message: IntegrationMessage): Promise<void>;
}

class SlackAdapter implements IntegrationAdapter {
  name = 'slack';
  private webhookUrl: string | null;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
  }

  async send(message: IntegrationMessage): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('[Slack] SLACK_WEBHOOK_URL not set; skipping notification');
      return;
    }

    const colorMap: Record<string, string> = {
      red: '#DC2626',
      green: '#16A34A',
      yellow: '#CA8A04',
      blue: '#2563EB',
      purple: '#9333EA',
    };
    const color = colorMap[message.color || 'blue'] || colorMap.blue;

    const payload = {
      channel: message.channel,
      attachments: [
        {
          color,
          title: message.title,
          text: message.body,
          title_link: message.url,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[Slack] Failed to send notification:', error);
      throw error;
    }
  }
}

class TeamsAdapter implements IntegrationAdapter {
  name = 'teams';
  private webhookUrl: string | null;

  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || null;
  }

  async send(message: IntegrationMessage): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('[Teams] TEAMS_WEBHOOK_URL not set; skipping notification');
      return;
    }

    const colorMap: Record<string, string> = {
      red: 'DC2626',
      green: '16A34A',
      yellow: 'CA8A04',
      blue: '2563EB',
      purple: '9333EA',
    };
    const hexColor = colorMap[message.color || 'blue'] || colorMap.blue;

    const payload = {
      title: message.title,
      text: message.body,
      themeColor: hexColor,
      potentialAction: message.url
        ? [
            {
              '@type': 'OpenUri',
              name: 'View Details',
              targets: [{ os: 'default', uri: message.url }],
            },
          ]
        : [],
    };

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Teams webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[Teams] Failed to send notification:', error);
      throw error;
    }
  }
}

class GoogleWorkspaceAdapter implements IntegrationAdapter {
  name = 'google-workspace';
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.GOOGLE_WORKSPACE_API_KEY || null;
  }

  async send(_message: IntegrationMessage): Promise<void> {
    if (!this.apiKey) {
      console.warn('[Google Workspace] GOOGLE_WORKSPACE_API_KEY not set; skipping notification');
      return;
    }

    console.log('[Google Workspace] Integration placeholder — implement Calendar/Drive/Sheets sync here');
    // TODO: Implement Google Calendar event creation, Drive file sharing, Sheets reporting
  }
}

const adapters: IntegrationAdapter[] = [];
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  if (process.env.SLACK_WEBHOOK_URL) {
    adapters.push(new SlackAdapter());
  }
  if (process.env.TEAMS_WEBHOOK_URL) {
    adapters.push(new TeamsAdapter());
  }
  if (process.env.GOOGLE_WORKSPACE_API_KEY) {
    adapters.push(new GoogleWorkspaceAdapter());
  }
}

export async function sendIntegrationNotification(message: IntegrationMessage): Promise<void> {
  ensureInitialized();

  if (adapters.length === 0) {
    console.log('[Integrations] No adapters configured; skipping notification');
    return;
  }

  const results = await Promise.allSettled(
    adapters.map((adapter) =>
      adapter.send(message).catch((error) => {
        console.error(`[Integrations] ${adapter.name} failed:`, error);
        return null;
      })
    )
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[Integrations] ${failed.length}/${adapters.length} notifications failed`);
  }
}

export function getAvailableIntegrations(): string[] {
  ensureInitialized();
  return adapters.map((a) => a.name);
}

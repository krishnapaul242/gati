import { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand, InputLogEvent } from '@aws-sdk/client-cloudwatch-logs';
import type { ILogger } from '@gati-framework/contracts';

export interface CloudWatchLogsConfig {
  region: string;
  logGroupName: string;
  logStreamName: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class CloudWatchLogsAdapter implements ILogger {
  private client: CloudWatchLogsClient;
  private logGroupName: string;
  private logStreamName: string;
  private buffer: InputLogEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private sequenceToken?: string;
  private context: Record<string, any> = {};

  constructor(config: CloudWatchLogsConfig, context?: Record<string, any>) {
    this.client = new CloudWatchLogsClient({
      region: config.region,
      credentials: config.credentials,
    });
    this.logGroupName = config.logGroupName;
    this.logStreamName = config.logStreamName;
    this.context = context || {};
    
    this.initLogStream();
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  private async initLogStream(): Promise<void> {
    try {
      await this.client.send(new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create log stream:', error);
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('WARN', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('ERROR', message, context);
  }

  child(context: Record<string, any>): ILogger {
    return new CloudWatchLogsAdapter(
      {
        region: this.client.config.region as string,
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      },
      { ...this.context, ...context }
    );
  }

  private log(level: string, message: string, context?: Record<string, any>): void {
    this.buffer.push({
      timestamp: Date.now(),
      message: JSON.stringify({
        level,
        message,
        ...this.context,
        ...context,
      }),
    });

    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, 10000).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    try {
      const response = await this.client.send(new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: batch,
        sequenceToken: this.sequenceToken,
      }));
      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      console.error('Failed to send logs to CloudWatch:', error);
      this.buffer.unshift(...batch);
    }
  }

  async shutdown(): Promise<void> {
    clearInterval(this.flushInterval);
    await this.flush();
  }
}

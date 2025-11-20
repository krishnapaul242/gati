import { ChangeLogItem, TSV, ArtifactType } from './types.js';
import fs from 'fs';
import path from 'path';

export interface TimelineStore {
    append(item: ChangeLogItem): Promise<void>;
    getLatest(type: ArtifactType, id: string): Promise<ChangeLogItem | null>;
    query(filter: { from?: number; to?: number; type?: ArtifactType; actor?: string }): Promise<ChangeLogItem[]>;
    close(): Promise<void>;
}

export class SQLiteTimelineStore implements TimelineStore {
    private db: any;

    constructor(dbPath: string = ':memory:') {
        // Ensure directory exists if not memory
        if (dbPath !== ':memory:') {
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        try {
            // Dynamic import to avoid hard dependency on better-sqlite3
            const Database = require('better-sqlite3');
            this.db = new Database(dbPath);
            this.init();
        } catch (e) {
            throw new Error('better-sqlite3 is not installed. Please install it or use JSONTimelineStore.');
        }
    }

    private init() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS timeline (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload TEXT,
        diff TEXT,
        parents TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_timestamp ON timeline(timestamp);
      CREATE INDEX IF NOT EXISTS idx_type_actor ON timeline(type, actor);
    `);
    }

    async append(item: ChangeLogItem): Promise<void> {
        const stmt = this.db.prepare(`
      INSERT INTO timeline (id, timestamp, type, actor, payload, diff, parents)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            item.id,
            item.timestamp,
            item.type,
            item.actor,
            JSON.stringify(item.payload),
            item.diff ? JSON.stringify(item.diff) : null,
            JSON.stringify(item.parents)
        );
    }

    async getLatest(type: ArtifactType, id: string): Promise<ChangeLogItem | null> {
        const row = this.db.prepare(`
      SELECT * FROM timeline WHERE type = ? ORDER BY timestamp DESC LIMIT 1
    `).get(type) as any;

        if (!row) return null;

        return this.mapRow(row);
    }

    async query(filter: { from?: number; to?: number; type?: ArtifactType; actor?: string }): Promise<ChangeLogItem[]> {
        let sql = 'SELECT * FROM timeline WHERE 1=1';
        const params: any[] = [];

        if (filter.from) {
            sql += ' AND timestamp >= ?';
            params.push(filter.from);
        }
        if (filter.to) {
            sql += ' AND timestamp <= ?';
            params.push(filter.to);
        }
        if (filter.type) {
            sql += ' AND type = ?';
            params.push(filter.type);
        }
        if (filter.actor) {
            sql += ' AND actor = ?';
            params.push(filter.actor);
        }

        sql += ' ORDER BY timestamp ASC';

        const rows = this.db.prepare(sql).all(...params) as any[];
        return rows.map(this.mapRow);
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
        }
    }

    private mapRow(row: any): ChangeLogItem {
        return {
            id: row.id,
            timestamp: row.timestamp,
            type: row.type as ArtifactType,
            actor: row.actor,
            payload: JSON.parse(row.payload),
            diff: row.diff ? JSON.parse(row.diff) : undefined,
            parents: JSON.parse(row.parents),
        };
    }
}

export class JSONTimelineStore implements TimelineStore {
    private items: ChangeLogItem[] = [];
    private filePath: string | null = null;

    constructor(filePath?: string) {
        if (filePath) {
            this.filePath = filePath;
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                this.items = content.trim().split('\n').map(line => JSON.parse(line));
            }
        }
    }

    async append(item: ChangeLogItem): Promise<void> {
        this.items.push(item);
        if (this.filePath) {
            fs.appendFileSync(this.filePath, JSON.stringify(item) + '\n');
        }
    }

    async getLatest(type: ArtifactType, id: string): Promise<ChangeLogItem | null> {
        // Simple in-memory search
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].type === type) {
                return this.items[i];
            }
        }
        return null;
    }

    async query(filter: { from?: number; to?: number; type?: ArtifactType; actor?: string }): Promise<ChangeLogItem[]> {
        return this.items.filter(item => {
            if (filter.from && item.timestamp < filter.from) return false;
            if (filter.to && item.timestamp > filter.to) return false;
            if (filter.type && item.type !== filter.type) return false;
            if (filter.actor && item.actor !== filter.actor) return false;
            return true;
        });
    }

    async close(): Promise<void> {
        // No-op for JSON store
    }
}

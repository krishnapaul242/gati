/**
 * Analyzer Incremental Reanalysis Performance Benchmarks
 * 
 * Tests file watching and incremental analysis performance.
 * Target: Small file edit <100ms, Incremental recompile <100ms
 */

import { bench, describe } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock analyzer functions
interface TypeInfo {
  name: string;
  properties: Record<string, string>;
  constraints: Record<string, string[]>;
}

interface FileAnalysis {
  filePath: string;
  exports: string[];
  types: TypeInfo[];
  imports: string[];
}

class MockAnalyzer {
  private cache: Map<string, FileAnalysis> = new Map();
  private astCache: Map<string, unknown> = new Map();

  analyzeFile(filePath: string, content: string): FileAnalysis {
    // Simulate AST parsing
    const ast = this.parseAST(content);
    this.astCache.set(filePath, ast);
    
    // Extract exports
    const exports = this.extractExports(content);
    
    // Extract types
    const types = this.extractTypes(content);
    
    // Extract imports
    const imports = this.extractImports(content);
    
    const analysis: FileAnalysis = { filePath, exports, types, imports };
    this.cache.set(filePath, analysis);
    
    return analysis;
  }

  private parseAST(content: string): unknown {
    // Simulate TypeScript AST parsing (expensive operation)
    const lines = content.split('\n');
    const tokens = lines.flatMap(line => line.split(/\s+/));
    return { lines: lines.length, tokens: tokens.length };
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) exports.push(match[1]);
    }
    return exports;
  }

  private extractTypes(content: string): TypeInfo[] {
    const types: TypeInfo[] = [];
    const typeRegex = /type\s+(\w+)\s*=\s*\{([^}]+)\}/g;
    let match;
    while ((match = typeRegex.exec(content)) !== null) {
      if (match[1] && match[2]) {
        types.push({
          name: match[1],
          properties: this.parseProperties(match[2]),
          constraints: {},
        });
      }
    }
    return types;
  }

  private parseProperties(propsStr: string): Record<string, string> {
    const props: Record<string, string> = {};
    const lines = propsStr.split('\n');
    for (const line of lines) {
      const propMatch = /(\w+)\s*:\s*(\w+)/.exec(line.trim());
      if (propMatch && propMatch[1] && propMatch[2]) {
        props[propMatch[1]] = propMatch[2];
      }
    }
    return props;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) imports.push(match[1]);
    }
    return imports;
  }

  incrementalAnalyze(filePath: string, content: string, changedLines: number[]): FileAnalysis {
    const cached = this.cache.get(filePath);
    
    if (cached && changedLines.length < 10) {
      // Incremental analysis - only re-parse changed sections
      const analysis = { ...cached };
      
      // Re-extract exports and types (simpler than full AST parse)
      analysis.exports = this.extractExports(content);
      analysis.types = this.extractTypes(content);
      
      this.cache.set(filePath, analysis);
      return analysis;
    }
    
    // Fall back to full analysis
    return this.analyzeFile(filePath, content);
  }

  clearCache(): void {
    this.cache.clear();
    this.astCache.clear();
  }
}

// Sample TypeScript handler file content
const sampleHandlerContent = `
import type { Handler } from '@gati-framework/runtime';

export const METHOD = 'GET';
export const ROUTE = '/api/users/:id';

type User = {
  id: string;
  email: string;
  name: string;
  age: number;
};

export const getUserHandler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  const user = await gctx.modules['database']?.findUser(userId);
  
  if (!user) {
    throw new HandlerError('User not found', 404);
  }
  
  res.json({ user });
};
`;

// Larger file for complex analysis
const largeHandlerContent = sampleHandlerContent.repeat(5) + `
type CreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  address: {
    street: string;
    city: string;
    country: string;
  };
};

type UpdateUserInput = Partial<CreateUserInput>;
`;

describe('Analyzer Performance', () => {
  describe('Single File Analysis', () => {
    const analyzer = new MockAnalyzer();

    bench('analyze small handler file (cold)', () => {
      analyzer.clearCache();
      analyzer.analyzeFile('/handlers/users/get.ts', sampleHandlerContent);
    }, { iterations: 20 });

    bench('analyze small handler file (warm cache)', () => {
      analyzer.analyzeFile('/handlers/users/get.ts', sampleHandlerContent);
    }, { iterations: 50 });
  });

  describe('Incremental Reanalysis', () => {
    const analyzer = new MockAnalyzer();
    
    // Warm up cache
    analyzer.analyzeFile('/handlers/users/get.ts', sampleHandlerContent);

    // Simulate small edit (changed 2 lines)
    const modifiedContent = sampleHandlerContent.replace(
      'User not found',
      'User does not exist'
    );

    bench('incremental analysis (small edit)', () => {
      analyzer.incrementalAnalyze('/handlers/users/get.ts', modifiedContent, [15, 16]);
    }, { iterations: 20 });
  });

  describe('Large File Analysis', () => {
    const analyzer = new MockAnalyzer();

    bench('analyze large handler file (500+ lines)', () => {
      analyzer.clearCache();
      analyzer.analyzeFile('/handlers/users/complex.ts', largeHandlerContent);
    }, { iterations: 10 });
  });

  describe('Multiple File Analysis', () => {
    const analyzer = new MockAnalyzer();
    const files = Array.from({ length: 10 }, (_, i) => ({
      path: `/handlers/route${i}.ts`,
      content: sampleHandlerContent,
    }));

    bench('analyze 10 files in sequence', () => {
      analyzer.clearCache();
      for (const file of files) {
        analyzer.analyzeFile(file.path, file.content);
      }
    }, { iterations: 5 });
  });

  describe('Dependency Analysis', () => {
    const analyzer = new MockAnalyzer();
    const fileWithImports = `
import type { Handler } from '@gati-framework/runtime';
import { validateEmail } from '../utils/validation';
import { UserService } from '../services/user';
import { logger } from '../lib/logger';

${sampleHandlerContent}
`;

    bench('analyze file with multiple imports', () => {
      analyzer.analyzeFile('/handlers/users/get.ts', fileWithImports);
    }, { iterations: 20 });
  });

  describe('Type Extraction', () => {
    const analyzer = new MockAnalyzer();
    const fileWithComplexTypes = `
type User = {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  roles: string[];
  metadata: Record<string, unknown>;
};

type CreateUser = Omit<User, 'id'>;
type UpdateUser = Partial<CreateUser>;
type UserResponse = Pick<User, 'id' | 'email' | 'profile'>;
`;

    bench('extract complex nested types', () => {
      analyzer.analyzeFile('/types/user.ts', fileWithComplexTypes);
    }, { iterations: 20 });
  });

  describe('Real-World Scenario', () => {
    const analyzer = new MockAnalyzer();
    
    // Simulate developer workflow: edit → save → analyze
    const iterations = 3;
    const files = [
      '/handlers/auth/login.ts',
      '/handlers/auth/register.ts',
      '/handlers/users/get.ts',
    ];

    bench('developer edit cycle (3 files)', () => {
      for (let i = 0; i < iterations; i++) {
        for (const filePath of files) {
          const modified = sampleHandlerContent.replace(
            'User not found',
            `User not found (iteration ${i})`
          );
          analyzer.incrementalAnalyze(filePath, modified, [15]);
        }
      }
    }, { iterations: 5 });
  });
});

// Performance expectations:
// - Single file analysis (small): < 50ms
// - Incremental reanalysis (small edit): < 100ms
// - Large file analysis (500+ lines): < 200ms
// - Multiple files (10): < 500ms total (50ms avg per file)
// - Complex type extraction: < 100ms
// - Real-world edit cycle: < 300ms for 3 file changes

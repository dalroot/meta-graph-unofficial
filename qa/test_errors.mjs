import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const cases = [
  ['ghost_get_profile', {}],
  ['ghost_get_media_metrics', {}],
  ['ghost_get_comments', {}],
  ['ghost_search', {}],
  ['ghost_audit_account', {}],
];

const client = new Client(
  { name: 'ghost-error-qa', version: '1.0.0' },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcp/server.js']
});

let passed = 0;
let failed = 0;

try {
  await client.connect(transport);

  for (const [name, args] of cases) {
    try {
      const result = await client.callTool({
        name,
        arguments: args
      });

      const text = JSON.stringify(result);
      const hasError = result.isError === true;

      if (hasError) {
        console.log(`PASS: ${name} rejected missing arguments`);
        passed++;
      } else {
        console.log(`FAIL: ${name} accepted missing arguments: ${text.slice(0, 250)}`);
        failed++;
      }
    } catch (error) {
      console.log(`PASS: ${name} rejected request: ${error.message}`);
      passed++;
    }
  }

  console.log(`\nResults: ${passed} PASS, ${failed} FAIL`);
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error('MCP connection failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

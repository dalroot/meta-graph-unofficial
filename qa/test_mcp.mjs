import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const expectedTools = [
  'ghost_get_profile',
  'ghost_get_posts',
  'ghost_get_media_metrics',
  'ghost_get_comments',
  'ghost_search',
  'ghost_explore_viral',
  'ghost_audit_account'
];

const client = new Client(
  { name: 'ghost-qa-client', version: '1.0.0' },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcp/server.js']
});

try {
  await client.connect(transport);
  console.log('PASS: MCP handshake');

  const response = await client.listTools();
  const available = response.tools.map(tool => tool.name);

  for (const name of expectedTools) {
    const found = available.includes(name);
    console.log(`${found ? 'PASS' : 'FAIL'}: ${name}`);
  }

  const missing = expectedTools.filter(name => !available.includes(name));
  if (missing.length > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

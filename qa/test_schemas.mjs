import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const expected = {
  ghost_get_profile: ['username'],
  ghost_get_posts: [],
  ghost_get_media_metrics: ['mediaId'],
  ghost_get_comments: ['mediaId'],
  ghost_search: ['query'],
  ghost_explore_viral: [],
  ghost_audit_account: ['username']
};

const client = new Client(
  { name: 'ghost-schema-qa', version: '1.0.0' },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcp/server.js']
});

let failures = 0;

try {
  await client.connect(transport);
  const { tools } = await client.listTools();

  for (const [name, required] of Object.entries(expected)) {
    const tool = tools.find(t => t.name === name);

    if (!tool) {
      console.log(`FAIL: ${name} missing`);
      failures++;
      continue;
    }

    const schema = tool.inputSchema || {};
    const actualRequired = schema.required || [];
    const properties = schema.properties || {};

    const valid = schema.type === 'object'
      && required.every(key => actualRequired.includes(key))
      && required.every(key => properties[key]?.type === 'string');

    console.log(`${valid ? 'PASS' : 'FAIL'}: ${name} schema`);

    if (!valid) failures++;
  }

  process.exitCode = failures ? 1 : 0;
} catch (error) {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

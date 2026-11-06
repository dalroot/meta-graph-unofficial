import fs from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client(
  { name: 'ghost-offline-discovery-qa', version: '1.0.0' },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcp/server.js'],
  env: {
    ...process.env,
    OFFLINE_MODE: 'true'
  }
});

const tests = [
  {
    name: 'ghost_search',
    arguments: { query: 'artificial intelligence', type: 'users' }
  },
  {
    name: 'ghost_explore_viral',
    arguments: { limit: 5 }
  }
];

const results = [];

try {
  await client.connect(transport);

  for (const test of tests) {
    try {
      const response = await client.callTool(
        {
          name: test.name,
          arguments: test.arguments
        },
        undefined,
        { timeout: 10000 }
      );

      results.push({
        tool: test.name,
        arguments: test.arguments,
        isError: response.isError === true,
        content: response.content
      });

      console.log(`\n=== ${test.name} ===`);
      console.log(JSON.stringify(response, null, 2));
    } catch (error) {
      results.push({
        tool: test.name,
        arguments: test.arguments,
        exception: error.message
      });

      console.log(`\n=== ${test.name}: EXCEPTION ===`);
      console.log(error.message);
    }
  }

  fs.mkdirSync('qa/results', { recursive: true });
  fs.writeFileSync(
    'qa/results/offline_discovery.json',
    JSON.stringify({
      mode: 'offline',
      tested_at: new Date().toISOString(),
      results
    }, null, 2)
  );

  console.log('\nSaved: qa/results/offline_discovery.json');
} catch (error) {
  console.error('MCP connection failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

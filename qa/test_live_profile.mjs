import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const username = process.argv[2] || 'instagram';

const client = new Client(
  { name: 'ghost-live-profile-qa', version: '1.0.0' },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcp/server.js']
});

try {
  await client.connect(transport);

  console.log(`Testing @${username} via MCP...`);

  const result = await client.callTool(
    {
      name: 'ghost_get_profile',
      arguments: { username }
    },
    undefined,
    { timeout: 45000 }
  );

  console.log(JSON.stringify(result, null, 2));

  if (result.isError) {
    console.log('RESULT: MCP tool returned an error.');
    process.exitCode = 1;
  } else {
    console.log('RESULT: MCP call completed. Data accuracy NOT yet verified.');
  }
} catch (error) {
  console.error('TEST ERROR:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

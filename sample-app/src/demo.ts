import 'dotenv/config';
import OpenAI from 'openai';
import { wrapOpenAI } from 'observeai-sdk';

// --- Config ---
const openai = wrapOpenAI(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  {
    apiKey: process.env.OBSERVEAI_API_KEY!,
    baseUrl: process.env.OBSERVEAI_URL || 'http://localhost:3001/api',
    debug: true,
    metadata: {
      userId: 'demo-user',
      sessionId: `demo-${Date.now()}`,
      tags: ['sample-app', 'demo'],
    },
  }
);

async function simpleChat() {
  console.log('\n=== 1. Simple Chat Completion ===\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'What is observability in software engineering? Answer in 2 sentences.' },
    ],
  });

  console.log('Response:', response.choices[0].message.content);
}

async function toolCalling() {
  console.log('\n=== 2. Tool / Function Calling ===\n');

  const tools: OpenAI.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name, e.g. "London"' },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature unit' },
          },
          required: ['location'],
        },
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'What is the weather like in Tokyo?' },
    ],
    tools,
    tool_choice: 'auto',
  });

  const message = response.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    console.log('Tool called:', message.tool_calls[0].function.name);
    console.log('Arguments:', message.tool_calls[0].function.arguments);

    // Simulate tool response
    const toolResult = JSON.stringify({ location: 'Tokyo', temperature: 22, unit: 'celsius', condition: 'Partly cloudy' });

    const followUp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'What is the weather like in Tokyo?' },
        message,
        {
          role: 'tool',
          tool_call_id: message.tool_calls[0].id,
          content: toolResult,
        },
      ],
      tools,
    });

    console.log('Final response:', followUp.choices[0].message.content);
  } else {
    console.log('Response (no tool call):', message.content);
  }
}

async function multiTurn() {
  console.log('\n=== 3. Multi-turn Conversation ===\n');

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: 'You are a helpful assistant that explains things simply.' },
    { role: 'user', content: 'What is an API?' },
  ];

  // Turn 1
  const response1 = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  const assistantMsg = response1.choices[0].message.content!;
  console.log('Turn 1:', assistantMsg);

  // Turn 2
  messages.push({ role: 'assistant', content: assistantMsg });
  messages.push({ role: 'user', content: 'Can you give me a real-world analogy?' });

  const response2 = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  console.log('Turn 2:', response2.choices[0].message.content);
}

// --- Run all demos ---
async function main() {
  console.log('ObserveAI SDK Demo');
  console.log('==================');
  console.log(`Sending logs to: ${process.env.OBSERVEAI_URL || 'http://localhost:3001/api'}`);

  try {
    await simpleChat();
    await toolCalling();
    await multiTurn();

    console.log('\n=== Done ===');
    console.log('Flushing remaining logs...');
    await openai._observeai.shutdown();
    console.log('All logs sent. Check your ObserveAI dashboard!');
  } catch (error: any) {
    console.error('\nError:', error.message);
    if (error.message?.includes('API key')) {
      console.error('Hint: Make sure OPENAI_API_KEY is set in your .env file');
    }
    await openai._observeai.shutdown();
    process.exit(1);
  }
}

main();

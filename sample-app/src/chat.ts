import 'dotenv/config';
import * as readline from 'readline';
import OpenAI from 'openai';
import { wrapOpenAI } from 'observeai-sdk';

const openai = wrapOpenAI(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  {
    apiKey: process.env.OBSERVEAI_API_KEY!,
    baseUrl: process.env.OBSERVEAI_URL || 'http://localhost:3001/api',
    debug: true,
    metadata: {
      userId: 'chat-user',
      sessionId: `chat-${Date.now()}`,
      tags: ['sample-app', 'interactive-chat'],
    },
  }
);

const messages: OpenAI.ChatCompletionMessageParam[] = [
  { role: 'system', content: 'You are a helpful assistant. Keep responses concise.' },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(): void {
  rl.question('\nYou: ', async (input) => {
    const trimmed = input.trim();

    if (!trimmed) {
      prompt();
      return;
    }

    if (trimmed.toLowerCase() === 'exit') {
      console.log('\nFlushing logs...');
      await openai._observeai.shutdown();
      console.log('Goodbye!');
      rl.close();
      return;
    }

    messages.push({ role: 'user', content: trimmed });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });

      const reply = response.choices[0].message.content!;
      messages.push({ role: 'assistant', content: reply });
      console.log(`\nAssistant: ${reply}`);
    } catch (error: any) {
      console.error(`\nError: ${error.message}`);
    }

    prompt();
  });
}

console.log('ObserveAI Interactive Chat');
console.log('==========================');
console.log('Type your message and press Enter. Type "exit" to quit.\n');

prompt();

import { StripeAgentToolkit } from '@stripe/agent-toolkit/ai-sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function testStripeAgent() {
  try {
    // Check required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not found in environment');
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment. Please add it to your .env file.');
    }

    console.log('🔧 Initializing Stripe Agent Toolkit...');
    
    const stripeAgentToolkit = new StripeAgentToolkit({
      secretKey: process.env.STRIPE_SECRET_KEY,
      configuration: {
        actions: {
          paymentLinks: {
            create: true,
          },
          products: {
            create: true,
          },
          prices: {
            create: true,
          },
        },
      },
    });

    console.log('🤖 Generating response with AI...');
    
    const result = await generateText({
      model: openai('gpt-4o'),
      tools: {
        ...stripeAgentToolkit.getTools(),
      },
      prompt: 'Create a payment link for a new product called "Test" with a price of $100.',
    });

    console.log('\n✅ Success!');
    console.log('\n📝 AI Response:');
    console.log(result.text);
    
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('\n🔧 Tool Calls Made:');
      result.toolCalls.forEach((call, index) => {
        console.log(`  ${index + 1}. ${call.toolName}`);
      });
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('OPENAI_API_KEY')) {
        console.log('\n💡 Tip: Add your OpenAI API key to .env:');
        console.log('   OPENAI_API_KEY="sk-..."');
      }
    } else {
      console.error('❌ Error:', error);
    }
    process.exit(1);
  }
}

testStripeAgent();

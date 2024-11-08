// src/app/api/chat/route.js

import OpenAI from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { message } = await req.json();

  const stream = new Readable({
    async read() {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
          stream: true,
        });

        for await (const chunk of response) {
          // Extract the content from the chunk
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            this.push(content);
          }
        }

        this.push(null); // Close the stream when done
      } catch (error) {
        console.error("Streaming error:", error);
        this.destroy(error); // End stream with error
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

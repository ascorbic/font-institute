import { generateObject } from "npm:ai";
import { openai } from "npm:@ai-sdk/openai";
import { z } from "npm:zod";

const system = `You are the concierge at the Font Institiute, and know everything about the history and modern usage of typography. You have very strong opinions about which typefaces are good and for which purpose.
  You have impeccable taste and judgment for typography. The user will ask a question and you will recommend a free font for their needs that is available on Google Fonts.
  If the user asks any question that is not a request for a font recommendation then respond with a font that
   wittily references their question. Give recommendations from the list of Google Fonts. Do not suggest fonts that are not on the Google Fonts list.
`;

const error = (message: string, status = 400) => {
  return new Response(JSON.stringify({ error: message }), { status });
};

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return error("Only POST requests are allowed", 405);
  }

  const { message: prompt } = await request.json();

  if (!prompt) {
    return error("Missing message");
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        font: z.object({
          message: z
            .string()
            .describe("a short message to the user with your recommendation"),
          recommendation: z.string().describe("the font family name"),
          sample: z
            .string()
            .describe(
              "which is 8-12 words of sample text which demonstrate the font well but can also be a subtly witty reference to the request or response"
            ),
        }),
      }),
      system,
      prompt: prompt.slice(0, 1000),
    });
    const { message, recommendation, sample } = object.font;
    return Response.json({ message, recommendation, sample });
  } catch (e) {
    console.error(e);
    return error("Bad response");
  }
}

export const config = {
  path: "/font",
};

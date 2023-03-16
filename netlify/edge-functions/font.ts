const system = {
  role: "system",
  content: `You are the concierge at the Font Institiute, and know everything about the history and modern usage of typography. You have very strong opinions about which typefaces are good and for which purpose. 
  You have impeccable taste and judgment for typography. The user will ask a question and you will recommend a free font for their needs that is available on Google Fonts. 
  If the user asks any question that is not a request for a font recommendation then respond with a font that
   wittily references their question. Give recommendations from the list of Google Fonts. Do not suggest fonts that are not on the Google Fonts list. Respond with a JSON object that has three fields: 
   'message': a short message to the user with your recommendation, 
   'recommendation': the font family name
   'sample' which is 8-12 words of sample text which demonstrate the font well but can also be a subtly witty reference to the request or response
    `,
};

const error = (message: string, status = 400) => {
  return new Response(JSON.stringify({ error: message }), { status });
};

const headers = {
  Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
  "Content-Type": "application/json",
};

const url = "https://api.openai.com/v1/chat/completions";

async function fetchFromApi(body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `Bad response from OpenAI API: ${res.status} ${res.statusText}`
    );
  }
  const result = await res.json();
  return result?.choices?.[0]?.message?.content;
}

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return error("Only POST requests are allowed", 405);
  }

  const { message } = await request.json();

  if (!message) {
    return error("Missing message");
  }

  const body = {
    model: "gpt-3.5-turbo",
    temperature: 1.5,
    messages: [
      system,
      {
        role: "user",
        content: `Respond with a JSON object only. My request: ${message}`,
      },
    ],
  };

  try {
    const response = await fetchFromApi(body);

    try {
      const { message, recommendation, sample } = JSON.parse(response);
      return Response.json({ message, recommendation, sample });
    } catch (e) {
      console.log(e);
      // Retry once, letting the API know that the response was bad
      body.messages.push({
        role: "user",
        content: `Your response was not valid JSON. The error was "${e.message}". Please respond with just a JSON object and nothing else.`,
      });
      const retriedResponse = await fetchFromApi(body);
      console.log(retriedResponse);
      const { message, recommendation, sample } = JSON.parse(retriedResponse);
      return Response.json({ message, recommendation, sample });
    }
  } catch (e) {
    console.error(e);
    return error("Bad response");
  }
}

export const config = {
  path: "/font",
};

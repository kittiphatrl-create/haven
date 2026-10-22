import { LIMITS } from "./schema";

export class InputError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function readRequestBody(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin");
  const requestHost = request.headers.get("host") ?? new URL(request.url).host;
  if (origin && new URL(origin).host !== requestHost)
    throw new InputError(
      "This demo only accepts requests from its own page.",
      403,
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new InputError("Please send a JSON request.", 415);
  if (Number(request.headers.get("content-length")) > LIMITS.body)
    throw new InputError("The request is too large.", 413);
  if (!request.body) throw new InputError("The request is empty.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > LIMITS.body) {
        await reader.cancel();
        throw new InputError("The request is too large.", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError("The request could not be read. Please try again.");
  } finally {
    reader.releaseLock();
  }
}

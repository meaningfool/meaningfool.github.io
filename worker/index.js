// Cloudflare serves static assets without byte ranges: a Range request gets the
// whole file with status 200. Safari won't play a <video> unless the server
// answers its Range requests with 206, so this Worker adds them. wrangler.jsonc
// runs it only for /images/*, where the article videos are; Cloudflare serves
// every other file directly.

export default {
  async fetch(request, env) {
    const asset = await env.ASSETS.fetch(request.url, { method: request.method });
    if (asset.status !== 200) return asset;
    const range = request.headers.get('Range');
    if (request.method !== 'GET' || !range) return acceptRanges(asset);

    // Stream the requested bytes instead of loading the file into memory, so large
    // videos stay within the Worker's CPU and memory limits. Without a size, read
    // the file to measure it.
    const length = asset.headers.get('Content-Length');
    const file = length === null ? new Uint8Array(await asset.arrayBuffer()) : null;
    const size = file ? file.byteLength : Number(length);
    const bounds = parseRange(range, size);
    if (!bounds) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const [start, end] = bounds;
    const headers = new Headers(asset.headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.delete('Content-Length');
    if (file) return new Response(file.slice(start, end + 1), { status: 206, headers });

    // FixedLengthStream, from the Workers runtime, sends the Content-Length.
    const { readable, writable } = new FixedLengthStream(end - start + 1);
    asset.body.pipeThrough(byteRange(start, end)).pipeTo(writable);
    return new Response(readable, { status: 206, headers });
  },
};

function acceptRanges(response) {
  const headers = new Headers(response.headers);
  headers.set('Accept-Ranges', 'bytes');
  return new Response(response.body, { status: response.status, headers });
}

/** Parses a single range such as `bytes=0-1`, `bytes=100-` or `bytes=-500`. Returns [start, end] or null. */
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === '' && match[2] === '')) return null;
  const [start, end] = match[1] === ''
    ? [Math.max(size - Number(match[2]), 0), size - 1]
    : [Number(match[1]), match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1)];
  return start <= end && start < size ? [start, end] : null;
}

/** Passes on bytes start to end (inclusive) of a byte stream, then stops reading it. */
function byteRange(start, end) {
  let offset = 0;
  return new TransformStream({
    transform(chunk, controller) {
      const chunkStart = offset;
      offset += chunk.byteLength;
      const from = Math.max(start - chunkStart, 0);
      const to = Math.min(end + 1 - chunkStart, chunk.byteLength);
      if (from < to) controller.enqueue(chunk.subarray(from, to));
      if (offset > end) controller.terminate();
    },
  });
}

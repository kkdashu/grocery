
export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// API Route: List files
		// Format: /api/list?prefix=folder/
		if (url.pathname === '/api/list') {
			console.log("Fetch api/list");
			const prefix = url.searchParams.get('prefix') || '';
			const options: R2ListOptions = {
				prefix: prefix,
				delimiter: '/',
			};

			const listing = await env.AssetsStore.list(options);

			// Map to a cleaner JSON structure
			const responseData = {
				objects: listing.objects.map(o => ({
					key: o.key,
					size: o.size,
					uploaded: o.uploaded,
					httpEtag: o.httpEtag
				})),
				delimitedPrefixes: listing.delimitedPrefixes,
				truncated: listing.truncated,
				cursor: listing.cursor
			};

			return new Response(JSON.stringify(responseData), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// API Route: Get File
		// Format: /api/file/path/to/file.txt
		if (url.pathname.startsWith('/api/file/')) {
			const rawKey = url.pathname.slice('/api/file/'.length);
			const key = decodeURIComponent(rawKey);


			if (!key) {
				return new Response('Missing key', { status: 404 });
			}

			const object = await env.AssetsStore.get(key);

			if (object === null) {
				return new Response('Object Not Found', { status: 404 });
			}

			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);

			// Extract filename and force download
			const filename = key.split('/').pop() || 'download';
			headers.set('Content-Disposition', `attachment; filename="${filename}"`);

			return new Response(object.body, {
				headers,
			});
		}
		// Fallback for API routes
		if (url.pathname.startsWith('/api/')) {
			return new Response('Not Found', { status: 404 });
		}

		// For standard requests, if it's SPA, Cloudflare Handles it?
		// Since we removed not_found_handling, we must handle the fallback to index.html manually for the React App.
		// If we are here, it's not an API route, and it wasn't a direct match for a static file (handled by Asset Service).
		// So we serve index.html to let React Router handle it.
		try {
			// env.ASSETS is the binding to the static assets
			// @ts-ignore
			if (env.ASSETS) {
				// @ts-ignore
				return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
			}
		} catch (e) {
			console.error("Error fetching index.html:", e);
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

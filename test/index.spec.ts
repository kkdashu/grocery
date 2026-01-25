
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../worker/index';

describe('Grocery Worker API', () => {
	it('lists files via API', async () => {
		const request = new Request('http://example.com/api/list');
		const ctx = createExecutionContext();

		// Mock R2 list response
		const listSpy = vi.spyOn(env.AssetsStore, 'list').mockResolvedValue({
			objects: [
				{ key: 'file1.txt', size: 1024, httpEtag: 'etag1', uploaded: new Date(), version: '1' } as any
			],
			delimitedPrefixes: ['folder1/'],
			truncated: false
		});

		const response = await worker.fetch(request as any, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/json');
		const data = await response.json() as any;
		expect(data.objects).toHaveLength(1);
		expect(data.objects[0].key).toBe('file1.txt');
		expect(data.delimitedPrefixes).toContain('folder1/');
	});

	it('lists subfolder via API', async () => {
		const request = new Request('http://example.com/api/list?prefix=folder1/');
		const ctx = createExecutionContext();

		const listSpy = vi.spyOn(env.AssetsStore, 'list').mockResolvedValue({
			objects: [],
			delimitedPrefixes: [],
			truncated: false
		});

		const response = await worker.fetch(request as any, env, ctx);
		// Verify list called with correct prefix
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
			prefix: 'folder1/'
		}));
	});

	it('serves a file via API', async () => {
		const request = new Request('http://example.com/api/file/file1.txt');
		const ctx = createExecutionContext();

		// Mock R2 get response
		const getSpy = vi.spyOn(env.AssetsStore, 'get').mockResolvedValue({
			body: 'file content' as any,
			writeHttpMetadata: vi.fn(),
			httpEtag: 'etag1',
		} as any);

		const response = await worker.fetch(request as any, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe('file content');
	});

	it('returns 404 for non-existent file via API', async () => {
		const request = new Request('http://example.com/api/file/nonexistent');
		const ctx = createExecutionContext();

		const getSpy = vi.spyOn(env.AssetsStore, 'get').mockResolvedValue(null);

		const response = await worker.fetch(request as any, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});

	it('returns 404 for unknown routes', async () => {
		const request = new Request('http://example.com/some/random/page');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request as any, env, ctx);
		expect(response.status).toBe(404);
	});
});

const base = process.env.BACKEND_URL || 'http://localhost:3000';

async function main() {
	const url = `${base.replace(/\/$/, '')}/health/db`;
	try {
		const res = await fetch(url);
		const json = await res.json();
		console.log(`GET ${url} -> ${res.status}`);
		console.log(JSON.stringify(json, null, 2));
		if (!json.ok) {
			process.exitCode = 1;
		}
	} catch (err) {
		console.error(`Failed to reach ${url}:`, err?.message || err);
		process.exitCode = 2;
	}
}
main();

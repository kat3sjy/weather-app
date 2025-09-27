import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_PROFILES } from '../mock/profiles';
import { analyzeProfile, scoreCompatibility, getAIStatus } from '../lib/aiApi';
import type { Profile } from '../types/ai';
import type { ProfileAnalysis, AIStatus } from '../lib/aiApi';
import { isLikelyFallbackSummary } from '../lib/aiApi';

const AIDemoPage: React.FC = () => {
	const profiles: Profile[] = MOCK_PROFILES;
	const [aIndex, setAIndex] = useState(0);
	const [bIndex, setBIndex] = useState(1);
	const [analysis, setAnalysis] = useState<unknown | null>(null);
	const [score, setScore] = useState<unknown | null>(null);

	const aJson = useMemo(() => JSON.stringify(profiles[aIndex], null, 2), [profiles, aIndex]);
	const bJson = useMemo(() => JSON.stringify(profiles[bIndex], null, 2), [profiles, bIndex]);

	const onAnalyze = async () => {
		setScore(null);
		setAnalysis('loading...');
		try {
			const res = await analyzeProfile(profiles[aIndex]);
			setAnalysis(res);
		} catch (e: any) {
			setAnalysis({ error: e?.message ?? String(e) });
		}
	};

	const onScore = async () => {
		setAnalysis(null);
		setScore('loading...');
		try {
			const res = await scoreCompatibility(profiles[aIndex], profiles[bIndex]);
			setScore(res);
		} catch (e: any) {
			setScore({ error: e?.message ?? String(e) });
		}
	};

	// Analysis UI state
	const [analyses, setAnalyses] = useState<Record<string, ProfileAnalysis>>({});
	const [analyzing, setAnalyzing] = useState(false);
	const [analysisError, setAnalysisError] = useState<string | null>(null);

	const runMockAnalyses = async () => {
		setAnalyzing(true);
		setAnalysisError(null);
		try {
			const results = await Promise.all(
				MOCK_PROFILES.map((p) => analyzeProfile(p))
			);
			const byId: Record<string, ProfileAnalysis> = {};
			MOCK_PROFILES.forEach((p, i) => { byId[p.id] = results[i]; });
			setAnalyses(byId);
		} catch (err: any) {
			setAnalysisError(err?.message || 'Failed to analyze profiles');
		} finally {
			setAnalyzing(false);
		}
	};

	const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
	const [statusError, setStatusError] = useState<string | null>(null);

	useEffect(() => {
		getAIStatus()
			.then(s => setAiStatus(s))
			.catch(err => setStatusError(err?.message || 'Failed to fetch AI status'));
	}, []);

	const clientModelHint = (import.meta?.env as any)?.VITE_GEMINI_MODEL as string | undefined;

	const anyLoading = analyzing || analysis === 'loading...' || score === 'loading...';

	return (
		<div style={{ padding: 16 }}>
			<h1>AI Demo</h1>

			{statusError && (
				<div style={{ margin: '8px 0', padding: 8, background: '#fff3cd', border: '1px solid #ffecb5', borderRadius: 6, color: '#664d03' }}>
					Status error: {statusError}
				</div>
			)}
			{aiStatus && (
				<div style={{ margin: '8px 0', padding: 8, background: aiStatus.configured ? '#e7f5ff' : '#fff3cd', border: '1px solid #d0ebff', borderRadius: 6 }}>
					<div style={{ fontSize: 13 }}>
						AI status: {aiStatus.configured ? `configured (server: ${aiStatus.model || 'unknown'})` : 'not configured — using fallback summaries'}
						{clientModelHint ? ` — client hint: ${clientModelHint}` : ''}
						{aiStatus.lastModelUsed ? ` — last model used: ${aiStatus.lastModelUsed}` : ''}
					</div>
					{aiStatus.lastError && (
						<div style={{ fontSize: 12, color: '#b00020', marginTop: 4 }}>
							Last AI error: {aiStatus.lastError}
						</div>
					)}
				</div>
			)}

			<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
				<label>
					Profile A:{' '}
					<select value={aIndex} onChange={(e) => setAIndex(Number(e.target.value))} disabled={anyLoading}>
						{profiles.map((p, i) => (
							<option key={p.id} value={i}>
								{p.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Profile B:{' '}
					<select value={bIndex} onChange={(e) => setBIndex(Number(e.target.value))} disabled={anyLoading}>
						{profiles.map((p, i) => (
							<option key={p.id} value={i}>
								{p.name}
							</option>
						))}
					</select>
				</label>
				<button onClick={onAnalyze} disabled={anyLoading}>Analyze A</button>
				<button onClick={onScore} disabled={anyLoading}>Score A↔B</button>
			</div>

			<div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>Profile A</h3>
					<pre>{aJson}</pre>
				</div>
				<div>
					<h3>Profile B</h3>
					<pre>{bJson}</pre>
				</div>
			</div>

			<div style={{ marginTop: 16 }}>
				{analysis && (
					<>
						<h3>Analysis</h3>
						<pre>{typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}</pre>
					</>
				)}
				{score && (
					<>
						<h3>Compatibility</h3>
						<pre>{typeof score === 'string' ? score : JSON.stringify(score, null, 2)}</pre>
					</>
				)}
			</div>

			<section style={{ marginTop: 24 }}>
				<h2>AI Profile Analysis (mock)</h2>
				<p>Generates a paragraph summary per profile using Gemini via /api/ai/analyze.</p>
				<button onClick={runMockAnalyses} disabled={analyzing}>
					{analyzing ? 'Analyzing…' : 'Analyze mock profiles'}
				</button>
				{analysisError && <div style={{ color: 'red', marginTop: 8 }}>{analysisError}</div>}

				{Object.keys(analyses).length > 0 && (
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
						{MOCK_PROFILES.map((p) => {
							const a = analyses[p.id];
							if (!a) return null;

							// Be resilient to different shapes from the server and fallback
							const summary =
								(a as any)?.summary ??
								(a as any)?.paragraph ??
								(a as any)?.text ??
								(a as any)?.analysis?.summary ??
								'';

							const meta = (a as any)?._meta;
							const fallbackish =
								(meta && typeof meta.usedFallback === 'boolean')
									? meta.usedFallback
									: isLikelyFallbackSummary(summary);

							return (
								<div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
										<span>{p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || p.username || p.id}</span>
										{fallbackish && (
											<span style={{ fontSize: 11, color: '#666', border: '1px solid #ddd', borderRadius: 6, padding: '1px 6px' }}>
												fallback{meta?.model ? ` (${meta.model})` : ''}
											</span>
										)}
									</div>
									<div style={{ marginTop: 4, lineHeight: 1.5 }}>
										{summary || '—'}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
};

export default AIDemoPage;

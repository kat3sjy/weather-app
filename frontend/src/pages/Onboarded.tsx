import { useState } from 'react';

export default function Onboarded() {
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');

	return (
		<div style={{ maxWidth: 520, margin: '48px auto', padding: 16 }}>
			<h1 style={{ marginBottom: 8 }}>Choose your name</h1>
			<p style={{ color: '#6b7280', marginBottom: 16 }}>
				This is how others will see you. You can change it later in settings.
			</p>

			<div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
				<input
					type="text"
					placeholder="First name"
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
					autoComplete="given-name"
					style={{ flex: 1, padding: '10px 12px' }}
				/>
				<input
					type="text"
					placeholder="Last name (optional)"
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					autoComplete="family-name"
					style={{ flex: 1, padding: '10px 12px' }}
				/>
			</div>

			<div style={{ color: '#6b7280', fontSize: 14 }}>
				Preview: {(firstName + ' ' + lastName).trim() || 'Your display name'}
			</div>
		</div>
	);
}

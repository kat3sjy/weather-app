import type { Profile } from '../types/ai';

export const MOCK_PROFILES: Profile[] = [
	{
		id: 'p1',
		name: 'Alex Johnson',
		bio: 'Frontend dev who loves TypeScript and design systems.',
		interests: ['web', 'react', 'design', 'coffee'],
	},
	{
		id: 'p2',
		name: 'Sam Lee',
		bio: 'Data viz and maps nerd. Weekend climber.',
		interests: ['d3', 'maps', 'climbing', 'travel'],
	},
	{
		id: 'p3',
		name: 'Priya Patel',
		bio: 'Mobile engineer exploring AI UX.',
		interests: ['react-native', 'ai', 'ux', 'hiking'],
	},
];

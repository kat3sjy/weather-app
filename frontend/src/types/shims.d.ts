// Temporary shims to suppress TS errors before dependencies are installed.
// Remove this file after running `npm install`.

// Extremely minimal React type placeholders (REMOVE once real @types/react installed)
declare namespace React {
	interface SyntheticEvent<T = any> { target: T }
	interface ChangeEvent<T = any> extends SyntheticEvent<T> {}
	interface InputHTMLAttributes<T> {}
	interface TextareaHTMLAttributes<T> {}
	interface SelectHTMLAttributes<T> {}
	type ReactNode = any;
}
declare module 'react' {
	export = React;
}
declare module 'react-dom/client';
declare module 'react-router-dom';
declare module 'zustand';

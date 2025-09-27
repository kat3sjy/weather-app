/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_GEMINI_MODEL?: string;
	readonly VITE_AI_DEBUG?: string; // '1' to enable analyze debug
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

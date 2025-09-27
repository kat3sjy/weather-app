import express from 'express';
import healthRouter from './routes/health';

export const app = express();

app.use('/health', healthRouter);

// If not already exporting, ensure app is exported (used by tests)
// export const app = app;

// ...existing code that starts the server...
// app.listen(process.env.PORT || 3000, () => console.log('API up'));

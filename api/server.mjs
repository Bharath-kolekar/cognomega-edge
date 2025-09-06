import express from 'express';
import { si } from './routes/si.mjs';

const app = express();
app.use(express.json());

app.get('/healthz', (_req,res)=>res.json({ ok: true }));

app.use('/api/si', si);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));

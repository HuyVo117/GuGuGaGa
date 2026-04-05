import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import adminRouter from './routes/admin.route.js';
import userRouter from './routes/user.route.js';
import shipperRouter from './routes/shipper.route.js';
import publicRouter from './routes/public.route.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.json({
		message: 'GuGuGaGa Backend is running (src architecture)',
		health: '/health',
	});
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
	res.status(204).send();
});

app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/shipper', shipperRouter);
app.use('/api/public', publicRouter);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'backend-src' }));
app.listen(port, () => {
	console.log(`[src] Backend listening on http://localhost:${port}`);
});

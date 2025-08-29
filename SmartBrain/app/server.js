import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import knex from 'knex';
import bcrypt from 'bcrypt';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.PGHOST || '127.0.0.1',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'smartbrain'
  }
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({status: 'ok'}));

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json('incorrect form submission');
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.transaction(async trx => {
      await trx('login').insert({ hash, email });
      const user = await trx('users').insert({ email, name }).returning('*');
      res.json(user[0]);
    });
  } catch (e) {
    res.status(400).json('unable to register');
  }
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json('incorrect form submission');
  try {
    const data = await db('login').where({ email }).first();
    if (!data) return res.status(400).json('wrong credentials');
    const isValid = await bcrypt.compare(password, data.hash);
    if (isValid) {
      const user = await db('users').where({ email }).first();
      return res.json(user);
    } else {
      return res.status(400).json('wrong credentials');
    }
  } catch (e) {
    res.status(400).json('unable to signin');
  }
});

app.get('/profile/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db('users').where({ id }).first();
    if (user) res.json(user);
    else res.status(404).json('not found');
  } catch (e) {
    res.status(400).json('error getting user');
  }
});

app.put('/image', async (req, res) => {
  const { id } = req.body;
  try {
    const user = await db('users').where({ id }).increment('entries', 1).returning('*');
    res.json(user[0]);
  } catch (e) {
    res.status(400).json('unable to get entries');
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`smartbrain-api running on ${port}`));

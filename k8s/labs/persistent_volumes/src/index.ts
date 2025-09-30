import { Client } from 'pg';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/test', async (req, res) => {
  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  try {
    await client.connect();
    console.log('Successfully connected to the database');

    const queryResult = await client.query('SELECT NOW()');
    console.log('Current database time:', queryResult.rows[0].now);
    res.send(`Current database time: ${queryResult.rows[0].now}`);
  } catch (err: any) {
    console.error('Error connecting to the database or executing query:', err);
    res.status(500).send('Error connecting to the database or executing query');
  } finally {
    await client.end();
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});

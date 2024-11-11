const express = require('express');
const cors = require('cors');  // This line imports the cors module
const { Pool } = require('pg');
const dns = require('dns').promises;
const net = require('net');

const app = express();
const port = 3000;

app.use(cors());

// Log all environment variables
console.log('Environment variables:');
console.log('PGUSER:', process.env.PGUSER);
console.log('PGHOST:', process.env.PGHOST);
console.log('PGDATABASE:', process.env.PGDATABASE);
console.log('PGPASSWORD:', process.env.PGPASSWORD);
console.log('PGPORT:', process.env.PGPORT);

const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
console.log('Using connection string:', connectionString);

const pool = new Pool({ connectionString });

// Enhanced DNS lookup function
async function performDnsLookup(hostname) {
  try {
    const addresses = await dns.lookup(hostname);
    console.log(`DNS lookup for ${hostname}:`, addresses);
    return addresses;
  } catch (error) {
    console.error(`DNS lookup failed for ${hostname}:`, error);
    return null;
  }
}

// TCP connection test function
function testTcpConnection(host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);  // 5 second timeout

    socket.connect(port, host, () => {
      console.log(`TCP connection to ${host}:${port} successful`);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', (error) => {
      console.error(`TCP connection to ${host}:${port} failed:`, error.message);
      reject(error);
    });

    socket.on('timeout', () => {
      console.error(`TCP connection to ${host}:${port} timed out`);
      socket.destroy();
      reject(new Error('Connection timed out'));
    });
  });
}

// Perform diagnostics
async function runDiagnostics() {
  console.log('Running diagnostics...');
  
  // DNS lookup
  const pgHostAddress = await performDnsLookup(process.env.PGHOST);
  
  // TCP connection test
  if (pgHostAddress) {
    try {
      await testTcpConnection(pgHostAddress.address, process.env.PGPORT);
    } catch (error) {
      console.error('TCP connection test failed:', error.message);
    }
  }
  
  // Test database connection
  try {
    console.log('Attempting to connect to the database...');
    const client = await pool.connect();
    console.log('Successfully connected to the database.');
    const result = await client.query('SELECT NOW()');
    console.log('Database query successful. Current timestamp:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

// Run diagnostics on startup
runDiagnostics();

app.get('/person', async (req, res) => {
  console.log('Called /person endpoint');
  try {
    const result = await pool.query('SELECT * FROM person');
    console.log('Query executed successfully, row count:', result.rowCount);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in /person endpoint:', error);
    res.status(500).json({
      error: 'Server error',
      details: error.message,
      stack: error.stack
    });
  }
});

app.get('/run-diagnostics', async (req, res) => {
  console.log('Running diagnostics from endpoint');
  await runDiagnostics();
  res.send('Diagnostics completed. Check server logs for details.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle process termination
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});
const io = require('socket.io-client');
const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const WS_PATH = '/ws/';

// Color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Function to get JWT token
async function getToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'demo',
      password: 'demo123',
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          logSuccess(
            `Authentication successful! Token obtained for user: ${response.user.username}`
          );
          resolve(response.token);
        } else {
          logError(`Authentication failed with status ${res.statusCode}: ${data}`);
          reject(new Error(`Authentication failed: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      logError(`HTTP request error: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Function to test Socket.IO connection
async function testSocketConnection(token) {
  return new Promise((resolve, reject) => {
    logInfo('Attempting to connect to Socket.IO server...');
    logInfo(`URL: ${BACKEND_URL}`);
    logInfo(`Path: ${WS_PATH}`);

    const socket = io(BACKEND_URL, {
      path: WS_PATH,
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    let connectionTimeout;
    let eventTestTimeout;
    const receivedEvents = [];

    // Set a timeout for connection
    connectionTimeout = setTimeout(() => {
      logError('Connection timeout after 10 seconds');
      socket.close();
      reject(new Error('Connection timeout'));
    }, 10000);

    // Connection event
    socket.on('connect', () => {
      clearTimeout(connectionTimeout);
      logSuccess(`Connected to Socket.IO server! Socket ID: ${socket.id}`);

      // Test subscribe event
      logInfo('Testing "subscribe" event...');
      socket.emit('subscribe', { symbols: ['AAPL', 'GOOGL'] });
    });

    // Listen for price updates
    socket.on('price_update', (data) => {
      if (!receivedEvents.includes('price_update')) {
        receivedEvents.push('price_update');
        logSuccess(`Received "price_update" event with ${data.length} tickers`);
        if (data.length > 0) {
          logInfo(`Sample ticker: ${JSON.stringify(data[0], null, 2)}`);
        }
      }
    });

    // Listen for subscribed confirmation
    socket.on('subscribed', (data) => {
      receivedEvents.push('subscribed');
      logSuccess(`Received "subscribed" confirmation: ${JSON.stringify(data)}`);

      // Test unsubscribe event
      logInfo('Testing "unsubscribe" event...');
      socket.emit('unsubscribe', { symbols: ['AAPL'] });
    });

    // Listen for unsubscribed confirmation
    socket.on('unsubscribed', (data) => {
      receivedEvents.push('unsubscribed');
      logSuccess(`Received "unsubscribed" confirmation: ${JSON.stringify(data)}`);

      // Wait a bit more for price updates, then disconnect
      eventTestTimeout = setTimeout(() => {
        logInfo('Disconnecting from server...');
        socket.close();
      }, 3000);
    });

    // Connection error
    socket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout);
      logError(`Connection error: ${error.message}`);
      reject(error);
    });

    // Disconnect event
    socket.on('disconnect', (reason) => {
      clearTimeout(eventTestTimeout);
      logWarning(`Disconnected from server. Reason: ${reason}`);

      // Summary
      console.log('\n' + '='.repeat(50));
      log('TEST SUMMARY', colors.blue);
      console.log('='.repeat(50));
      logSuccess(`Total events received: ${receivedEvents.length}`);
      receivedEvents.forEach((event) => {
        logSuccess(`  - ${event}`);
      });
      console.log('='.repeat(50) + '\n');

      resolve();
    });
  });
}

// Main test function
async function runTests() {
  console.log('\n' + '='.repeat(50));
  log('SOCKET.IO CONNECTION TEST', colors.blue);
  console.log('='.repeat(50) + '\n');

  try {
    // Step 1: Check if server is running
    logInfo('Step 1: Checking if backend server is running...');
    const token = await getToken();

    // Step 2: Test WebSocket connection
    logInfo('\nStep 2: Testing WebSocket connection...');
    await testSocketConnection(token);

    logSuccess('\n✓ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logError(`\nTest failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      logWarning('Make sure the backend server is running on port 3001');
      logInfo('Run: cd backend && npm run dev');
    }
    process.exit(1);
  }
}

// Run the tests
runTests();

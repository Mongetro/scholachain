// backend/src/app.ts
/**
 * ScholaChain Backend Application
 * Main Express server configuration with MVC architecture
 * Uses controllers for clean separation of concerns
 */
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
// Controller imports
import { blockchainController } from './controllers/blockchain.controller.js';
import { certificateController } from './controllers/certificateController.js';
import { healthController } from './controllers/health.controller.js';
import { ipfsController } from './controllers/ipfs.controller.js';
// Validation imports
import {
  validateBody,
  validateParams,
} from './middleware/validationMiddleware.js';
import {
  certificateIdSchema,
  issueCertificateSchema,
} from './schemas/index.js';
// Error handling imports
import { errorHandler } from './utils/errorHandler.js';
// Service imports for initialization
import { adminService } from './services/adminService.js';
import { blockchainService } from './services/blockchainService.js';
import { ipfsService } from './services/ipfsService.js';
// Import routes
import adminRoutes from './routes/admin.routes.js';

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// ====================
// MIDDLEWARE SETUP
// ====================
// Security middleware - sets various HTTP headers for protection
app.use(helmet());

// CORS middleware - enables Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

// JSON parsing middleware - limits request body size to 5MB
app.use(express.json({ limit: '5mb' }));

// URL-encoded data parsing middleware
app.use(express.urlencoded({ extended: true }));

// ====================
// FILE UPLOAD CONFIGURATION
// ====================
/**
 * Multer configuration for file uploads
 * Supports PDF files up to 5MB for certificate documents
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, callback) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      callback(null, true);
    } else {
      callback(new Error('Only PDF files are allowed'));
    }
  },
});

// ====================
// SERVICE INITIALIZATION AND STATUS
// ====================
console.log('🔗 Initializing ScholaChain Backend...');

/**
 * Initialize and display blockchain service status
 */
async function initializeBlockchainService(): Promise<void> {
  try {
    const contractInfo = blockchainService.getContractInfo();
    console.log('📄 Smart Contract Information:');
    console.log(' Address:', contractInfo.address);
    console.log(' Network:', contractInfo.network);
    console.log(' Chain ID:', contractInfo.chainId);
    console.log(' Deployed:', contractInfo.deployedAt);
    console.log(' Connected:', contractInfo.connected);
    const blockchainStatus = await blockchainService.getBlockchainStatus();
    console.log('🌐 Blockchain Connection Status:', blockchainStatus.status);
    if (blockchainStatus.status === 'connected') {
      console.log(' Latest Block:', blockchainStatus.latestBlock);
      try {
        const totalCertificates =
          await blockchainService.getTotalCertificates();
        console.log(' Total Certificates on chain:', totalCertificates);
      } catch (certError) {
        console.warn(
          ' ⚠️ Could not fetch total certificates (normal for new contracts):',
          certError instanceof Error ? certError.message : 'Unknown error',
        );
        console.log(' Total Certificates on chain: 0 (assumed)');
      }
    } else {
      console.warn(' Connection Error:', blockchainStatus.error);
    }
  } catch (error) {
    console.error(
      '⚠️ Blockchain service initialization warning:',
      error instanceof Error ? error.message : error,
    );
    console.log(
      '💡 The application will continue running, but blockchain features may be limited.',
    );
  }
}

/**
 * Display admin service status
 */
function displayAdminServiceStatus(): void {
  try {
    const adminStatus = adminService.getStatus();
    console.log('👨‍💼 Admin Service Status:');
    console.log(' Initialized:', adminStatus.initialized);
    console.log(' Ready:', adminStatus.ready);
    console.log(' Network:', adminStatus.network);
    console.log(
      ' Write Operations:',
      adminStatus.readOnly ? '⚠️ Read-only' : '✅ Read/Write',
    );
    console.log(' 🏛️ Ministry Address:', adminService.getMinistryAddress());
    if (adminStatus.readOnly) {
      console.log(' 💡 Local development: Admin write operations disabled');
      console.log(
        ' 💡 Sepolia: Set TESTNET_PRIVATE_KEY for full admin functionality',
      );
    }
    // Display detailed service info for debugging
    const serviceInfo = adminService.getServiceInfo();
    console.log(' 🔧 Service Details:', {
      chain: serviceInfo.chain,
      account: serviceInfo.account,
      clients: serviceInfo.clients,
    });
  } catch (error) {
    console.error(
      '⚠️ Admin service status check failed:',
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Display IPFS service status
 */
function displayIPFSServiceStatus(): void {
  try {
    const ipfsStatus = ipfsService.getStatus();
    console.log('📦 IPFS Service:');
    console.log(
      ' Status:',
      ipfsStatus.configured ? '✅ Configured' : '⚠️ Local Mode',
    );
    console.log(' Provider:', ipfsStatus.provider);
    console.log(' Ready:', ipfsStatus.ready);
  } catch (error) {
    console.error(
      '⚠️ IPFS service status check failed:',
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Initialize all services with delay to ensure dependencies are ready
 */
async function initializeAllServices(): Promise<void> {
  // Initial delay to allow blockchain node to fully start
  setTimeout(async () => {
    console.log('\n🚀 Starting service initialization...');
    console.log('='.repeat(50));
    await initializeBlockchainService();
    console.log(''); // Empty line for readability
    displayAdminServiceStatus();
    console.log(''); // Empty line for readability
    displayIPFSServiceStatus();
    console.log('='.repeat(50));
    console.log('✅ All services initialized successfully!\n');
  }, 3000); // 3-second delay to allow blockchain node to fully start
}

// Start service initialization
initializeAllServices().catch(console.error);

// ====================
// API ROUTES WITH CONTROLLERS
// ====================
// Health routes
app.get('/health', healthController.healthCheck);
app.get('/api/status', healthController.systemStatus);
app.get('/api/test', healthController.test);

// Blockchain routes
app.get('/api/blockchain/status', blockchainController.getBlockchainStatus);
app.get(
  '/api/blockchain/certificates/total',
  blockchainController.getTotalCertificates,
);
app.get(
  '/api/blockchain/issuers/:address',
  blockchainController.checkIssuerAuthorization,
);
app.get('/api/blockchain/contract-info', blockchainController.getContractInfo);

// Admin routes
app.use('/api/admin', adminRoutes);

// Certificate routes with validation
app.get(
  '/api/certificates/:id',
  validateParams(certificateIdSchema),
  certificateController.getCertificate,
);
// Certificate verification with file upload
app.post(
  '/api/certificates/verify',
  upload.single('file'),
  certificateController.verifyCertificateWithFile,
);

// CORRECTION: Utiliser les nouvelles méthodes de préparation au lieu d'issueCertificate
app.post(
  '/api/certificates/prepare-issuance',
  validateBody(issueCertificateSchema),
  certificateController.prepareCertificateIssuance,
);

// IPFS routes
app.get('/api/ipfs/status', ipfsController.getStatus);
app.post('/api/ipfs/upload', upload.single('file'), ipfsController.uploadFile);
app.post('/api/ipfs/finalize', ipfsController.finalizeCertificateIssuance); // NOUVELLE ROUTE
app.get('/api/ipfs/verify/:cid', ipfsController.verifyFile);
app.post(
  '/api/certificates/prepare-complete',
  upload.single('file'),
  ipfsController.prepareCertificateWithoutIPFS,
);

// ====================
// ERROR HANDLING MIDDLEWARE
// ====================
/**
 * 404 Handler - Catch unhandled routes
 */
app.use((req, res) => {
  const response = {
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
});

/**
 * Global Error Handler - Use our custom error handler
 */
app.use(errorHandler);

// ====================
// SERVER STARTUP
// ====================
/**
 * Start the Express server
 */
app.listen(PORT, () => {
  console.log(`🚀 ScholaChain Backend Server started successfully!`);
  console.log(`📍 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
  // Display initial service status
  const adminStatus = adminService.getStatus();
  console.log(
    `🔗 Blockchain network: ${blockchainService.getContractInfo().network}`,
  );
  console.log(
    `👨‍💼 Admin service: ${adminStatus.ready ? '✅ Ready' : '❌ Not Ready'}`,
  );
  console.log(
    `📦 IPFS service: ${
      ipfsService.getStatus().configured ? '✅ Configured' : '⚠️ Local Mode'
    }`,
  );
  console.log('='.repeat(50));
});

// Export the app for testing purposes
export default app;

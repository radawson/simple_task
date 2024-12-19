// src/config/server.config.js
import { promises as fs } from 'fs';
import https from 'https';
import http from 'http';
import Logger from '../core/Logger.js';
import certUtil from '../utils/cert.util.js';

const logger = Logger.getInstance();

export const createServers = async (app, config) => {
    const servers = {};
    
    try {
        // Basic validation
        if (!config.sslKey || !config.sslCert) {
            throw new Error('SSL key and certificate paths are required');
        }

        // Load and validate certificate
        const cert = await certUtil.loadCertificate(config.sslCert);
        certUtil.validateDateValidity(cert);

        // Get and log certificate info
        const certInfo = await certUtil.getCertificateInfo(config.sslCert);
        logger.info('Using SSL certificate:', {
            subject: certInfo.subject,
            validTo: certInfo.validTo,
            daysUntilExpiration: certInfo.daysUntilExpiration
        });

        // Create HTTPS server
        const httpsOptions = {
            key: await fs.readFile(config.sslKey),
            cert: await fs.readFile(config.sslCert)
        };

        servers.https = https.createServer(httpsOptions, app);
        await new Promise((resolve) => {
            servers.https.listen(config.sslPort, () => {
                logger.info(`HTTPS server listening on port ${config.sslPort}`);
                resolve();
            });
        });

        // Development HTTP server
        if (process.env.NODE_ENV === 'development') {
            servers.http = http.createServer(app);
            await new Promise((resolve) => {
                servers.http.listen(config.port, () => {
                    logger.info(`HTTP server listening on port ${config.port}`);
                    resolve();
                });
            });
        }

        return servers;
    } catch (error) {
        if (error.name === 'CertificateError') {
            logger.error('Certificate validation failed:', {
                message: error.message,
                details: error.details
            });
        } else {
            logger.error('Failed to create servers:', {
                error: error.message,
                paths: {
                    sslKey: config.sslKey,
                    sslCert: config.sslCert
                }
            });
        }
        throw error;
    }
};

export default createServers;
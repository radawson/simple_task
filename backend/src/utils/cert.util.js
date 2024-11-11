// src/utils/cert.util.js
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import { X509Certificate } from 'crypto';
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

class CertificateError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'CertificateError';
        this.details = details;
    }
}

class CertificateUtil {
    constructor(config = {}) {
        this.config = config;
        this.trustedRoots = new Set();
    }

    /**
     * Loads and validates a certificate from a file
     * @param {string} certPath - Path to the certificate file
     * @returns {Promise<X509Certificate>} The parsed certificate
     * @throws {CertificateError} If certificate is invalid or unreadable
     */
    async loadCertificate(certPath) {
        try {
            const certPem = await fs.readFile(certPath);
            const cert = new X509Certificate(certPem);
            logger.debug(`Loaded certificate: ${certPath}`, {
                subject: cert.subject,
                issuer: cert.issuer,
                validFrom: cert.validFrom,
                validTo: cert.validTo
            });
            return cert;
        } catch (error) {
            throw new CertificateError(`Failed to load certificate: ${error.message}`, {
                path: certPath,
                originalError: error.message
            });
        }
    }

    /**
     * Validates a certificate's validity period
     * @param {X509Certificate} cert - The certificate to validate
     * @throws {CertificateError} If certificate is expired or not yet valid
     */
    validateDateValidity(cert) {
        const now = new Date();
        const validFrom = new Date(cert.validFrom);
        const validTo = new Date(cert.validTo);
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        if (now < validFrom) {
            throw new CertificateError('Certificate is not yet valid', {
                validFrom: validFrom.toISOString(),
                validTo: validTo.toISOString(),
                currentTime: now.toISOString()
            });
        }

        if (now > validTo) {
            throw new CertificateError('Certificate has expired', {
                validFrom: validFrom.toISOString(),
                validTo: validTo.toISOString(),
                currentTime: now.toISOString()
            });
        }

        // Warn if certificate is close to expiration (30 days)
        if (validTo.getTime() - now.getTime() < thirtyDays) {
            logger.warn('Certificate is approaching expiration', {
                subject: cert.subject,
                expiresIn: Math.floor((validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) + ' days'
            });
        }
    }

    /**
     * Add a trusted root certificate
     * @param {string} certPath - Path to the root certificate
     */
    async addTrustedRoot(certPath) {
        const cert = await this.loadCertificate(certPath);
        this.trustedRoots.add(cert.fingerprint);
        logger.debug(`Added trusted root: ${cert.subject}`);
    }

    /**
     * Validates a certificate chain
     * @param {string} certPath - Path to the certificate
     * @param {string} chainPath - Path to the certificate chain
     * @param {string} [rootPath] - Optional path to trusted root certificate
     * @returns {Promise<boolean>} True if chain is valid
     * @throws {CertificateError} If chain is invalid
     */
    async validateCertificateChain(certPath, chainPath, rootPath = null) {
        const cert = await this.loadCertificate(certPath);
        const chain = await this.loadCertificate(chainPath);
        
        // Validate dates for both cert and chain
        this.validateDateValidity(cert);
        this.validateDateValidity(chain);

        // If root provided, validate against it
        if (rootPath) {
            const root = await this.loadCertificate(rootPath);
            if (!this.trustedRoots.has(root.fingerprint)) {
                await this.addTrustedRoot(rootPath);
            }
            
            // Verify chain of trust
            if (!cert.verify(chain.publicKey)) {
                throw new CertificateError('Invalid certificate chain');
            }
            if (!chain.verify(root.publicKey)) {
                throw new CertificateError('Chain not trusted by root CA');
            }
        }

        return true;
    }

    /**
     * Validates server SSL configuration
     * @param {Object} config - Server SSL configuration
     * @returns {Promise<boolean>} True if configuration is valid
     * @throws {CertificateError} If configuration is invalid
     */
    async validateServerSSLConfig(config) {
        try {
            // Load and validate certificate
            const cert = await this.loadCertificate(config.sslCert);
            this.validateDateValidity(cert);

            // Check private key matches certificate
            const keyPem = await fs.readFile(config.sslKey);
            const key = crypto.createPrivateKey(keyPem);
            const signature = crypto.sign('sha256', Buffer.from('test'), key);
            
            try {
                const verified = crypto.verify(
                    'sha256',
                    Buffer.from('test'),
                    cert.publicKey,
                    signature
                );
                if (!verified) {
                    throw new CertificateError('Private key does not match certificate');
                }
            } catch (error) {
                throw new CertificateError('Failed to verify key pair', {
                    originalError: error.message
                });
            }

            // If chain provided, validate it
            if (config.sslChain) {
                await this.validateCertificateChain(
                    config.sslCert,
                    config.sslChain,
                    config.rootCA
                );
            }

            logger.info('SSL configuration validated successfully');
            return true;
        } catch (error) {
            if (error instanceof CertificateError) {
                throw error;
            }
            throw new CertificateError('SSL configuration validation failed', {
                originalError: error.message
            });
        }
    }

    /**
     * Gets certificate information
     * @param {string} certPath - Path to the certificate
     * @returns {Promise<Object>} Certificate information
     */
    async getCertificateInfo(certPath) {
        const cert = await this.loadCertificate(certPath);
        return {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.validFrom,
            validTo: cert.validTo,
            serialNumber: cert.serialNumber,
            fingerprint: cert.fingerprint,
            keyUsage: cert.keyUsage,
            daysUntilExpiration: Math.floor(
                (new Date(cert.validTo) - new Date()) / (1000 * 60 * 60 * 24)
            )
        };
    }
}

export const certUtil = new CertificateUtil();
export default certUtil;
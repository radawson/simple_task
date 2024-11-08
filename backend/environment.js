const os = require('os');
const dns = require('dns');
const fs = require('fs');

/**
 * Get the local IP address of the server.
 * @returns {string} The local IP address.
 */
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';  // Fallback to localhost
}

/**
 * Parse /etc/hosts file to find all non-IPv6 hostnames.
 * @returns {string[]} An array of hostnames (including FQDNs) for non-IPv6 addresses.
 */
function getAllNonIPv6Hosts() {
  const hostsPath = '/etc/hosts';
  const hostnames = [];

  if (fs.existsSync(hostsPath)) {
    const hostsContent = fs.readFileSync(hostsPath, 'utf-8');
    const lines = hostsContent.split('\n');

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || line.trim() === '') continue;

      // Split line by whitespace to separate IP from hostnames
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const ipAddress = parts[0];

      // Skip IPv6 addresses (e.g., "::1", "fe00::0")
      if (ipAddress.includes(':')) continue;

      // Add each hostname in the line to the hostnames array
      hostnames.push(...parts.slice(1));  // Include all hostnames after the IP
    }
  }

  return hostnames;
}

/**
 * Get the DNS hostname of the server, with FQDN support.
 * @returns {Promise<string>} The primary DNS hostname or FQDN.
 */
async function getServerHostname() {
  // Check if there are non-IPv6 hosts in the /etc/hosts file
  const nonIPv6Hosts = getAllNonIPv6Hosts();
  if (nonIPv6Hosts.length > 0) {
    return nonIPv6Hosts[0];  // Use the first hostname found as the primary
  }

  // Fallback: Use default hostname resolution
  return new Promise((resolve, reject) => {
    dns.lookup(os.hostname(), (err, address) => {
      if (err) {
        reject(err);
      } else {
        resolve(address);
      }
    });
  });
}

/**
 * Generate a dynamic backend URL based on IP or DNS.
 * @param {string} protocol - The protocol to use ('http' or 'https').
 * @param {number} port - The port for the server.
 * @returns {Promise<string>} The dynamic backend URL.
 */
async function getDynamicBackendUrl(protocol = 'http', port = 80) {
  const ip = getLocalIp();
  const hostname = await getServerHostname();
  return `${protocol}://${hostname || ip}:${port}/`;
}

/**
 * Get all non-IPv6 hostnames from the /etc/hosts file for use in CORS configuration.
 * @returns {string[]} Array of non-IPv6 hostnames from /etc/hosts.
 */
function getAllCorsHosts() {
  return getAllNonIPv6Hosts();
}

module.exports = {
  getLocalIp,
  getServerHostname,
  getDynamicBackendUrl,
  getAllCorsHosts,
};

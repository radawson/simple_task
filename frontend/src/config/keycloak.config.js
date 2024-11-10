export const keycloakConfig = {
    url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.REACT_APP_KEYCLOAK_REALM || 'your-realm',
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'your-client'
  };
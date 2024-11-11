const authConfig = {
    enableSSO: import.meta.env.VITE_ENABLE_SSO === 'true',
    keycloak: {
      url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
      realm: import.meta.env.VITE_KEYCLOAK_REALM || 'your-realm',
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'your-client'
    }
  };
  
  export default authConfig;
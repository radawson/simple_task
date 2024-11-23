import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  console.error('Root element not found');
} else {
  const app = (
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );

  console.log('Mounting React app...');
  ReactDOM.createRoot(root).render(app);
}
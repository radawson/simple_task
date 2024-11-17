import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { AuthProvider } from './context/AuthContext';
import QRGenerator from './components/qr/QRGenerator';
import Templates from './components/templates/Templates';
import Tasks from './components/tasks/Tasks';
import TaskEdit from './components/tasks/TaskEdit';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  const router = createBrowserRouter([
    {
      element: <AuthProvider>{/* Don't self-close */}
        <Layout>
          <Outlet />
        </Layout>
      </AuthProvider>,
      path: '/', // Add root path
      children: [
        { index: true, element: <Dashboard /> },
        {
          path: 'tasks',
          children: [
            { index: true, element: <Tasks /> },
            { path: 'new', element: <TaskEdit /> },
            { path: 'edit/:id', element: <TaskEdit /> }
          ]
        },
        { path: 'templates', element: <Templates /> },
        { path: 'qr', element: <QRGenerator /> },
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        { path: '*', element: <Navigate to="/" /> }
      ]
    }
  ], {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }
  });

  return <RouterProvider router={router} />;
}

export default App;
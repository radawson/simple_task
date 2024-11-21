// src/App.jsx
import { BrowserRouter as Navigate } from 'react-router-dom';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import QRGenerator from './components/qr/QRGenerator';
import Templates from './components/templates/Templates';
import Tasks from './components/tasks/Tasks';
import TaskEdit from './components/tasks/TaskEdit';
import Events from './components/events/Events';
import EventEdit from './components/events/EventEdit';
import Notes from './components/notes/Notes';
import NoteEdit from './components/notes/NoteEdit';

function App() {
  const router = createBrowserRouter([
    {
      element: (
        <AuthProvider>
          <ToastProvider>
            <Layout>
              <Outlet />
            </Layout>
          </ToastProvider>
        </AuthProvider>
      ),
      path: '/',
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
        {
          path: 'events',
          children: [
            { index: true, element: <Events /> },
            { path: 'new', element: <EventEdit /> },
            { path: 'edit/:id', element: <EventEdit /> }
          ]
        },
        {
          path: 'notes',
          children: [
            { index: true, element: <Notes /> },
            { path: 'new', element: <NoteEdit /> },
            { path: 'edit/:id', element: <NoteEdit /> }
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
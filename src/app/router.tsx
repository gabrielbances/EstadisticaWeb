import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './route-guards'
import { AppShell } from '../layouts/AppShell'
import { AdminPage } from '../pages/AdminPage'
import { AnovaPage } from '../pages/AnovaPage'
import { AuthPage } from '../pages/AuthPage'
import { ChiSquarePage } from '../pages/ChiSquarePage'
import { DashboardPage } from '../pages/DashboardPage'
import { LandingPage } from '../pages/LandingPage'
import { ResultsPage } from '../pages/ResultsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/auth',
    element: (
      <PublicOnlyRoute>
        <AuthPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/anova',
        element: <AnovaPage />,
      },
      {
        path: '/chi-square',
        element: <ChiSquarePage />,
      },
      {
        path: '/results',
        element: <ResultsPage />,
      },
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

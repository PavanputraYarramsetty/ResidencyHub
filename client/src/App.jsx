import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ResidencyProvider } from './context/ResidencyContext';
import AppRoutes from './routes/AppRoutes';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ResidencyProvider>
          <AppRoutes />
        </ResidencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

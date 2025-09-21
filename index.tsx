import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import { isFirebaseConfigured } from './services/firebase';
import FirebaseConfigErrorPage from './pages/FirebaseConfigErrorPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if (!isFirebaseConfigured) {
  root.render(
    <React.StrictMode>
      <FirebaseConfigErrorPage />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}

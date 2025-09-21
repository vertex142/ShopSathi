
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../services/firebase';
// FIX: Replaced v9 modular imports with v8 compat imports to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

interface AuthContextType {
    // FIX: Changed `User` type to `firebase.User` from the compat library.
    user: firebase.User | null;
    loading: boolean;
    signup: (email: string, pass: string) => Promise<any>;
    login: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // FIX: Changed `User` type to `firebase.User` from the compat library.
    const [user, setUser] = useState<firebase.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // FIX: Switched from v9 `onAuthStateChanged(auth, ...)` to v8 `auth.onAuthStateChanged(...)`.
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    // FIX: Switched from v9 modular functions to v8 methods on the `auth` object.
    const signup = (email: string, pass: string) => auth.createUserWithEmailAndPassword(email, pass);
    const login = (email: string, pass: string) => auth.signInWithEmailAndPassword(email, pass);
    const logout = () => auth.signOut();

    const value = {
        user,
        loading,
        signup,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

import React from 'react';
import Logo from '../components/Logo';
import { AlertTriangle } from 'lucide-react';

const FirebaseConfigErrorPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 text-center">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <Logo className="h-16 w-16" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    ShopSathi
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
                    <div className="flex flex-col items-center">
                        <AlertTriangle className="h-12 w-12 text-red-500" />
                        <h3 className="mt-4 text-xl font-bold text-gray-800">Firebase Configuration Missing</h3>
                        <p className="mt-2 text-gray-600">
                            The application cannot connect to the backend database because the Firebase configuration variables are not set.
                        </p>
                        <div className="mt-6 text-left bg-gray-50 p-4 rounded-md w-full">
                            <h4 className="font-semibold text-gray-700">Action Required:</h4>
                            <p className="mt-2 text-sm text-gray-600">
                                To run this application, you need to provide your Firebase project credentials as environment variables. Please ensure the following variables are correctly set in your execution environment:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm font-mono bg-gray-200 p-3 rounded">
                                <li>FIREBASE_API_KEY</li>
                                <li>FIREBASE_AUTH_DOMAIN</li>
                                <li>FIREBASE_PROJECT_ID</li>
                                <li>FIREBASE_STORAGE_BUCKET</li>
                                <li>FIREBASE_MESSAGING_SENDER_ID</li>
                                <li>FIREBASE_APP_ID</li>
                            </ul>
                            <p className="mt-3 text-sm text-gray-600">
                                After setting these variables, please reload the application.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirebaseConfigErrorPage;

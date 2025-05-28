// components/AuthDebug.js (temporary debug component)
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testAuth } from '@/lib/base';
import { useAuth } from '@/context/AuthContext';

export default function AuthDebug() {
  const { user, token, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const checkStorage = () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        
        setDebugInfo({
          hasStoredToken: !!storedToken,
          storedTokenLength: storedToken?.length || 0,
          hasStoredUser: !!storedUser,
          storedUserValid: (() => {
            try {
              return storedUser ? !!JSON.parse(storedUser) : false;
            } catch {
              return false;
            }
          })(),
          authContextUser: !!user,
          authContextToken: !!token,
          authContextAuthenticated: isAuthenticated
        });
      }
    };

    checkStorage();
  }, [user, token, isAuthenticated]);

  const handleTestAuth = async () => {
    const result = await testAuth();
    setTestResult(result);
  };

  const handleClearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">🔍 Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-yellow-800">Storage Status:</h4>
            <ul className="text-yellow-700">
              <li>Token stored: {debugInfo.hasStoredToken ? '✅' : '❌'}</li>
              <li>Token length: {debugInfo.storedTokenLength}</li>
              <li>User stored: {debugInfo.hasStoredUser ? '✅' : '❌'}</li>
              <li>User valid: {debugInfo.storedUserValid ? '✅' : '❌'}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-yellow-800">Auth Context:</h4>
            <ul className="text-yellow-700">
              <li>User object: {debugInfo.authContextUser ? '✅' : '❌'}</li>
              <li>Token: {debugInfo.authContextToken ? '✅' : '❌'}</li>
              <li>Is authenticated: {debugInfo.authContextAuthenticated ? '✅' : '❌'}</li>
            </ul>
          </div>
        </div>

        {user && (
          <div className="p-3 bg-white rounded border">
            <h4 className="font-semibold text-yellow-800 mb-2">Current User:</h4>
            <pre className="text-xs text-yellow-700 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {testResult && (
          <div className="p-3 bg-white rounded border">
            <h4 className="font-semibold text-yellow-800 mb-2">API Test Result:</h4>
            <pre className="text-xs text-yellow-700 overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleTestAuth} variant="outline" size="sm">
            Test Auth API
          </Button>
          <Button onClick={handleClearAuth} variant="destructive" size="sm">
            Clear Auth Data
          </Button>
        </div>

        <div className="text-xs text-yellow-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check if all storage items are present (✅)</li>
            <li>Click "Test Auth API" to verify token works</li>
            <li>Check browser console for detailed logs</li>
            <li>If token is invalid, click "Clear Auth Data" and re-login</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
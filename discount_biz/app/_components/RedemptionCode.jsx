'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export function RedemptionCode({ code, status, businessName, productName }) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Generate QR code URL
  useEffect(() => {
    if (code) {
      // Use Google Charts API to generate QR code
      const encodedData = encodeURIComponent(code);
      setQrCodeUrl(`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodedData}&choe=UTF-8`);
    }
  }, [code]);

  // Handle copy to clipboard
  const handleCopy = () => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Check if offer is active
  const isActive = status === 'active';

  return (
    <div>
      <div className={`p-4 border rounded-lg text-center ${isActive ? 'bg-white' : 'bg-gray-50'}`}>
        {/* Business and product name */}
        {(businessName || productName) && (
          <div className="text-sm text-gray-500 mb-2">
            {businessName && <p className="font-medium">{businessName}</p>}
            {productName && <p className="truncate">{productName}</p>}
          </div>
        )}
        
        {/* QR code */}
        <div className="mb-4 flex justify-center">
          <div className={`p-4 bg-white rounded-lg inline-block ${!isActive ? 'opacity-50' : ''}`}>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Redemption QR Code" 
                width={160} 
                height={160} 
                className="mx-auto"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-100 animate-pulse rounded-md"></div>
            )}
          </div>
        </div>
        
        {/* Redemption code */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Redemption Code</p>
          <div className="flex items-center justify-center space-x-2">
            <div className={`font-mono text-xl font-bold tracking-wider py-2 px-4 ${!isActive ? 'text-gray-400' : ''}`}>
              {code}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={handleCopy}
              disabled={!isActive}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Status badge */}
        <div className={`text-xs px-3 py-1.5 rounded-full inline-block
          ${status === 'active' ? 'bg-green-100 text-green-700' : 
            status === 'redeemed' ? 'bg-blue-100 text-blue-700' : 
            'bg-gray-100 text-gray-700'}`
        }>
          {status === 'active' ? 'Ready to Redeem' : 
            status === 'redeemed' ? 'Redeemed' : 
            'Expired'}
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export function RedemptionInstructions({ 
  businessName = 'the business', 
  isOnline = false, 
  discountCode = '',
  status = 'active'
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Redeem</CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'active' ? (
          <>
            {!isOnline ? (
              // In-store redemption instructions
              <ol className="list-decimal pl-5 space-y-2">
                <li>Visit {businessName}</li>
                <li>Show the redemption code to a staff member</li>
                <li>The staff will verify and process your discount</li>
                <li>Enjoy your discounted purchase!</li>
              </ol>
            ) : (
              // Online redemption instructions
              <ol className="list-decimal pl-5 space-y-2">
                <li>Visit {businessName}'s website</li>
                <li>Add the desired product(s) to your cart</li>
                <li>Proceed to checkout</li>
                <li>
                  Enter the discount code: 
                  <Badge variant="outline" className="ml-2 font-mono">
                    {discountCode || 'YOUR_CODE'}
                  </Badge>
                </li>
                <li>Complete your purchase with the discount applied</li>
              </ol>
            )}
            
            <div className="mt-4 bg-blue-50 border-blue-200 border rounded-md p-3 flex">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>This offer can only be redeemed once</li>
                  <li>Cannot be combined with other promotions</li>
                  <li>Valid ID may be required for verification</li>
                </ul>
              </div>
            </div>
          </>
        ) : status === 'redeemed' ? (
          <div className="text-center py-3">
            <p className="text-gray-500">This offer has already been redeemed.</p>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-gray-500">This offer has expired and can no longer be redeemed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
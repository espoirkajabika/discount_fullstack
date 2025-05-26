import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

export function StatusBadge({ status }) {
  const variants = {
    active: {
      className: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
      icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
      label: "Active"
    },
    redeemed: {
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
      icon: <Clock className="h-3.5 w-3.5 mr-1" />,
      label: "Redeemed"
    },
    expired: {
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200",
      icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />,
      label: "Expired"
    },
    cancelled: {
      className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
      icon: <XCircle className="h-3.5 w-3.5 mr-1" />,
      label: "Cancelled"
    }
  };

  // Default to active status if unknown status is provided
  const variant = variants[status] || variants.active;

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center ${variant.className}`}
    >
      {variant.icon}
      {variant.label}
    </Badge>
  );
}
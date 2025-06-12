// Create this file: discount_biz/components/QRScanner.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, FlashLight, RotateCcw, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// QR Scanner Component with fallback support
export default function QRScanner({ 
  onScan, 
  onError, 
  onClose,
  isActive = false,
  showManualEntry = true 
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerRef = useRef(null);

  // Initialize QR scanner when component mounts
  useEffect(() => {
    if (isActive && !showManualInput) {
      initializeScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isActive, showManualInput]);

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Prefer back camera for mobile
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        setSelectedDeviceId(backCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
      
      return videoDevices;
    } catch (error) {
      console.error('Error getting cameras:', error);
      setError('Failed to access cameras');
      return [];
    }
  };

  // Request camera permission and start scanning
  const initializeScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setHasPermission(true);
      
      // Get available cameras after permission granted
      await getCameras();
      
      // Stop initial stream to restart with selected camera
      stream.getTracks().forEach(track => track.stop());
      
      // Start with selected camera
      await startScanning();
      
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
      setIsScanning(false);
      
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera or use manual entry.');
      } else {
        setError('Failed to access camera. Please try manual entry.');
      }
      
      if (onError) {
        onError(error);
      }
    }
  };

  // Start the actual scanning with selected camera
  const startScanning = async () => {
    try {
      // Import QR scanner library dynamically
      const { BrowserQRCodeReader } = await import('@zxing/library');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Use specific camera if selected
      if (selectedDeviceId) {
        constraints.video.deviceId = { exact: selectedDeviceId };
      } else {
        constraints.video.facingMode = 'environment';
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Check if torch is supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        setTorchSupported(capabilities.torch || false);
      }

      // Initialize QR code reader
      const codeReader = new BrowserQRCodeReader();
      scannerRef.current = codeReader;

      // Start scanning
      const result = await codeReader.decodeFromVideoDevice(
        selectedDeviceId || undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScanResult(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scan error:', error);
          }
        }
      );

    } catch (error) {
      console.error('Scanning error:', error);
      setError('Failed to start QR scanner. Please try manual entry.');
      setIsScanning(false);
    }
  };

  // Handle successful scan
  const handleScanResult = (scannedData) => {
    console.log('QR Code scanned:', scannedData);
    
    // Stop scanning
    stopScanner();
    
    // Process the scanned data
    if (onScan) {
      onScan(scannedData, 'qr_code');
    }
  };

  // Stop scanner and release resources
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
      scannerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setTorchEnabled(false);
  };

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled }]
      });
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error('Torch toggle error:', error);
    }
  };

  // Switch camera
  const switchCamera = async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    setSelectedDeviceId(nextDevice.deviceId);
    
    // Restart scanning with new camera
    stopScanner();
    setTimeout(() => {
      startScanning();
    }, 100);
  };

  // Handle manual code entry
  const handleManualSubmit = () => {
    const trimmedCode = manualCode.trim();
    if (trimmedCode) {
      if (onScan) {
        onScan(trimmedCode, 'manual_entry');
      }
      setManualCode('');
      setShowManualInput(false);
    }
  };

  // Retry scanning
  const retryScanning = () => {
    setError(null);
    setShowManualInput(false);
    initializeScanner();
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            {showManualInput ? 'Enter Claim ID' : 'Scan QR Code'}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!showManualInput ? (
            <>
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {isScanning && hasPermission ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Scanning Overlay */}
                    <div className="absolute inset-4 border-2 border-green-500 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                    </div>
                    
                    {/* Controls Overlay */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                      {torchSupported && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={toggleTorch}
                          className={`bg-black/50 hover:bg-black/70 text-white ${torchEnabled ? 'bg-yellow-600' : ''}`}
                        >
                          <FlashLight className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {devices.length > 1 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={switchCamera}
                          className="bg-black/50 hover:bg-black/70 text-white"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">
                        {hasPermission === false 
                          ? 'Camera permission required' 
                          : 'Initializing camera...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Point your camera at the QR code to scan it
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {error && (
                  <Button 
                    onClick={retryScanning}
                    className="flex-1"
                    variant="outline"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Retry Camera
                  </Button>
                )}
                
                {showManualEntry && (
                  <Button 
                    onClick={() => setShowManualInput(true)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Keyboard className="h-4 w-4 mr-2" />
                    Enter Manually
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Manual Entry Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim ID
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Enter claim ID (e.g., ABC12345)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSubmit();
                      }
                    }}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setShowManualInput(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Back to Scanner
                  </Button>
                  
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Verify Claim
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
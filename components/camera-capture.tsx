"use client"

import { useState, useRef, useEffect } from "react"
import * as faceapi from "face-api.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, RotateCcw, CheckCircle, ArrowLeft, Loader2 } from "lucide-react"

interface CameraCaptureProps {
  emiratesId: string
  onSuccess: () => void
  onBack: () => void
}

export function CameraCapture({ emiratesId, onSuccess, onBack }: CameraCaptureProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load face-api models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
      } catch (err) {
        console.error("Error loading face-api models:", err)
      }
    }
    loadModels()
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setIsLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please ensure camera permissions are granted.")
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const startCountdown = () => {
    if (countdown) return // prevent multiple timers
    setCountdown(3)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer)
          capturePhoto()
          return null
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageData)
        stopCamera()

        // Simulate face recognition processing
        setIsProcessing(true)
        setTimeout(() => {
          setIsProcessing(false)
          onSuccess()
        }, 3000)
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setIsProcessing(false)
    startCamera()
  }

  const formatEmiratesId = (id: string) => {
    return id.replace(/(\d{3})(\d{4})(\d{7})(\d)/, "$1-$2-$3-$4")
  }

  // 🔍 Auto face detection loop
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCameraActive && !capturedImage && videoRef.current) {
      interval = setInterval(async () => {
        if (!videoRef.current) return
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )

          if (detections.length === 1) {
            setWarning(null)
            if (!countdown) startCountdown()
          } else if (detections.length > 1) {
            setWarning("Multiple faces detected. Please stay alone in the frame.")
            if (countdown) setCountdown(null)
          } else {
            setWarning("No face detected. Please position your face in the frame.")
            if (countdown) setCountdown(null)
          }
        } catch (err) {
          console.error("Face detection error:", err)
        }
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isCameraActive, capturedImage, countdown])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <Button variant="ghost" onClick={onBack} className="absolute left-0 top-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Face Recognition Verification</h1>
          <p className="text-muted-foreground">Emirates ID: {formatEmiratesId(emiratesId)}</p>
        </div>

        {/* Camera Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">
              {isProcessing ? "Processing..." : capturedImage ? "Photo Captured" : "Position Your Face"}
            </CardTitle>
            <CardDescription>
              {isProcessing
                ? "Verifying your identity with Emirates ID database..."
                : capturedImage
                  ? "Face captured successfully. Processing verification..."
                  : "Look directly at the camera and ensure good lighting"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="relative">
              {/* Camera/Image Display */}
              <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                {capturedImage ? (
                  <img
                    src={capturedImage || "/placeholder.svg"}
                    alt="Captured face"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                )}

                {/* Face Detection Overlay */}
                {isCameraActive && !capturedImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-80 border-2 border-primary rounded-2xl border-dashed opacity-60">
                      <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                    </div>
                  </div>
                )}

                {/* Countdown Overlay */}
                {countdown && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-6xl font-bold text-white animate-pulse">{countdown}</div>
                  </div>
                )}

                {/* Warning Overlay */}
                {warning && !capturedImage && !isProcessing && (
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <p className="bg-red-600 text-white text-sm px-3 py-1 rounded-lg inline-block">{warning}</p>
                  </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                      <p className="text-lg font-medium">Verifying Identity...</p>
                      <p className="text-sm opacity-80">This may take a few moments</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden Canvas for Capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              {capturedImage && !isProcessing && (
                <Button onClick={retakePhoto} variant="outline" className="flex-1 bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Photo
                </Button>
              )}
            </div>

            {/* Instructions */}
            {isCameraActive && !capturedImage && !countdown && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                  Instructions for best results:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Position your face within the frame</li>
                  <li>• Ensure good lighting on your face</li>
                  <li>• Look directly at the camera</li>
                  <li>• Remove glasses if possible</li>
                  <li>• Keep a neutral expression</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

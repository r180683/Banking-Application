"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CreditCard, ArrowRight, Loader2 } from "lucide-react"
import swal from "sweetalert";

interface EmiratesIdDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (emiratesId: string, capturedImage: string) => void
}

export function EmiratesIdDialog({
  open,
  onClose,
  onSubmit,
}: EmiratesIdDialogProps) {
  const [emiratesId, setEmiratesId] = useState("")
  const [error, setError] = useState("")
  const [showFaceCapture, setShowFaceCapture] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [faceBox, setFaceBox] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionBufferRef = useRef<number[]>([])
  const faceapiRef = useRef<any>(null)


  // Custom sizing
  const containerWidth = "440px"
  const minContainerHeight = "300px"
  const maxContainerHeight = "330px"

  // Load FaceAPI models and start camera
useEffect(() => {
  if (!showFaceCapture) return

  const loadModelsAndStartCamera = async () => {
    try {
      const faceapi = await import("@vladmandic/face-api")
      faceapiRef.current = faceapi

      await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
      await startCamera()
    } catch (err) {
      console.error("FaceAPI load error:", err)
    }
  }

  loadModelsAndStartCamera()
  return () => stopCamera()
}, [showFaceCapture])


  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })
      if (videoRef.current) videoRef.current.srcObject = stream
      streamRef.current = stream
      setIsCameraActive(true)
    } catch (err) {
      console.error("Camera error:", err)
      alert("Unable to access camera. Please allow camera permissions.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  // Countdown functions
  const startCountdown = () => {
    if (countdownRef.current) return
    setCountdown(3)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null
        if (prev === 1) {
          stopCountdown()
          capturePhoto()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setCountdown(null)
  }

const capturePhoto = async () => {
  if (videoRef.current && canvasRef.current) {
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas.toDataURL("image/jpeg", 0.9)
    const base64Image = imageData.split(",")[1];
    
    setCapturedImage(base64Image)
    stopCountdown() // Stop countdown before processing
    setIsProcessing(true)

    try {
      const authnToken = localStorage.getItem("authnToken")
      if (!authnToken) throw new Error("Authentication token missing")

      // 🔹 Step 1: Get AuthCode
      const authCodeResp = await fetch(
        "https://stg.uaeid.icp.gov.ae/idp/api/SDKLogin/VerifyUserAuthData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authnToken: authnToken,
            authenticationScheme: "FACE",
            authenticationData: base64Image,
            approved: "true",
            randomCode: "482915",
            documentNumber: "A123456789",
          }),
        }
      )

      if (!authCodeResp.ok) throw new Error("Failed to get Authentication code")
      const authCodeData = await authCodeResp.json()

      if(authCodeData?.success===false){
        throw new Error(authCodeData?.message)
      }
      
      const authCode = authCodeData?.result?.authorizationCode
      if (!authCode) throw new Error(authCodeData?.result?.message)

      // 🔹 Step 2: Exchange AuthCode for Access Token
      const tokenResponse = await fetch(
        "https://stg.uaeid.icp.gov.ae/idp/api/Authentication/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization":
              "Basic ZEJKdlZQdlVBT0tJcGdrMTVMMHlSY1ljMXhVVFN3QjFnMTE1U0xEU05rNGhSODdIOlBuRUk5b1lwNWxPOFZLUzBCaWl5Z2dhVDExM29xcUVJTWxFb0VRcXZvOEVhREM4VFBoTFNZbk82eHo5UTliZlU=",
          },
          body: new URLSearchParams({
            code: authCode,
            client_id: "dBJvVPvUAOKIpgk15L0yRcYc1xUTSwB1g115SLDSNk4hR87H",
            redirect_uri: "https://stg.uaeid.icp.gov.ae/uae-banking-services/handleRedirect",
            grant_type: "authorization_code",
          }),
        }
      )

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData?.access_token
      if (!accessToken) throw new Error("No Access token received")

      localStorage.setItem("uaeFaceAccessToken", accessToken)

      setTimeout(() => {
        localStorage.removeItem("uaeFaceAccessToken");
        localStorage.removeItem("authnToken");
      }, 60 * 60 * 1000); // 1 hour

      // ✅ Submit success
      onSubmit(emiratesId, imageData)
    } 
    catch (err: any) {
      console.error("Face Capture Error:", err)
      setIsProcessing(false)

      // 🔹 Show SweetAlert with Retry/Cancel and actual error message
      const errorMessage =
        err?.message || "Unable to verify your face. Please try again."

      swal({
        title: "Face Verification Failed",
        text: errorMessage, // show actual error message here
        icon: "warning",
        buttons: {
          cancel: {
            text: "Cancel",
            value: false,
            visible: true,
          },
          confirm: {
            text: "Retry",
            value: true,
            visible: true,
          },
        },
      }).then((value) => {
        if (value) {
          // Retry clicked
          stopCountdown()
          setCapturedImage(null)
          setFaceBox(null)
          setWarning(null)
          setIsProcessing(false)
          detectionBufferRef.current = []

          stopCamera()
          startCamera()
          
        } else {
          // Cancel clicked
          handleDialogClose()
        }
      })
    }

    
  }
}



  // Stabilized face detection loop
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCameraActive && !capturedImage && videoRef.current) {
      interval = setInterval(async () => {
        if (!videoRef.current) return
        try {
         const faceapi = faceapiRef.current
        if (!faceapi) return

        const detections = await faceapi.detectAllFaces(

            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.3,
            })
          )
          const facesCount = detections.length
          detectionBufferRef.current.push(facesCount)
          if (detectionBufferRef.current.length > 3)
            detectionBufferRef.current.shift()
          const avgFaces =
            detectionBufferRef.current.reduce((a, b) => a + b, 0) /
            detectionBufferRef.current.length

          if (avgFaces >= 0.5 && facesCount === 1) {
            setWarning(null)
            const det = detections[0].box
            setFaceBox({
              x: det.x,
              y: det.y,
              width: det.width,
              height: det.height,
            })
            if (!countdown) startCountdown()
          } else if (facesCount > 1) {
            setFaceBox(null)
            stopCountdown()
            setWarning("Multiple faces detected. Please be alone in the frame.")
          } else {
            setFaceBox(null)
            stopCountdown()
            setWarning("No face detected. Position your face in the frame.")
          }
        } catch (err) {
          console.error("Face detection error:", err)
        }
      }, 200)
    }
    return () => clearInterval(interval)
  }, [isCameraActive, capturedImage, countdown])

  // Emirates ID validation & formatting
  const validateEmiratesId = (id: string) =>
    /^784-\d{4}-\d{7}-\d$/.test(id) || id.length === 15
  const formatEmiratesId = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    if (digits.length <= 14)
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(
      7,
      14
    )}-${digits.slice(14, 15)}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmiratesId(e.target.value)
    setError("")
  }


  const handleVerifyId = async () => { 
    if (!emiratesId.trim()) {
      setError("Please enter your Email / Mobile Number");
      return;
    }

    setError(""); // Clear previous errors
    try {
      const payload = {
        userInput: emiratesId,
        type: getInputType(emiratesId),
        clientId: "dBJvVPvUAOKIpgk15L0yRcYc1xUTSwB1g115SLDSNk4hR87H",
        clientType: 1,
        ip: "192.168.1.10",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0",
        typeOfDevice: "Desktop", // optionally, detect dynamically
      };

      const response = await fetch(
        "https://stg.uaeid.icp.gov.ae/idp/api/SDKLogin/VerifyUser", 
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("API response:", data);

      if(data?.success===false){
        setError(data?.message);
      }

      // Correct check for success
      if (data?.success && data?.result?.authnToken) {
        // Store the token (localStorage, sessionStorage, or state)
        localStorage.setItem("authnToken", data.result.authnToken);

        console.log("Auth Token stored:", data.result.authnToken);

        setShowFaceCapture(true); // show face capture after ID validation
      } else {
        setError(data?.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to validate Email / Mobile Number. Please try again.");
    }
  };


const getInputType = (userName: string): number => {
  const length = userName.length;

  if (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      userName
    )
  )
    return 2;
  else if (
    /^(((\+91)?|(91)?|(0)?)\d{10}|((\+256)?|(256)?|(0)?)\d{9})$/.test(userName)
  )
    return 1;
  else if (length === 14 && /^[A-Z0-9]{14}$/.test(userName))
    return 3;
  else if (/^[A-Z]{1,4}[0-9]{5,16}$/.test(userName))
    return 4;
  else return 5;
};



  const handleDialogClose = () => {
    setShowFaceCapture(false)
    setCapturedImage(null)
    stopCountdown()
    setWarning(null)
    setFaceBox(null)
    setEmiratesId("")
    setError("")
    detectionBufferRef.current = []
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Prevent closing on outside click
        
      }}
    >

      <DialogContent
        showCloseButton={false}
        style={{
          width: containerWidth,
          minHeight: minContainerHeight,
          maxHeight: maxContainerHeight,
          height: showFaceCapture ? "100%" : undefined,
        }}
        className="px-6 bg-gray-50 rounded-2xl shadow-lg flex items-center justify-center"
      >
        <button
          onClick={handleDialogClose}
          className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center rounded-xs 
                    opacity-70 hover:opacity-100 transition-opacity 
                    focus:ring-2 focus:ring-offset-2 focus:outline-none 
                    ring-offset-background focus:ring-ring
                    cursor-pointer"
        >
          ✕
          <span className="sr-only">Close</span>
        </button>

        {/* Emirates ID Form */}
        {!showFaceCapture && (
          <div className="flex flex-col space-y-6 w-full h-full">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-3">
   <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
     <CreditCard className="w-5 h-5 text-primary" />
   </div>
   UAEID Face Login
 </DialogTitle>
 <DialogDescription>
   Please enter your UAEID Email / Mobile Number to proceed with facial recognition login.
 </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label htmlFor="emirates-id" className="font-medium">
                Email / Mobile Number
              </Label>
              <Input
                id="emirates-id"
                type="text"
                placeholder="Enter Email / Mobile Number"
                value={emiratesId}
                onChange={handleInputChange}
                className="text-lg font-mono"
                autoFocus={!showFaceCapture}
                disabled={showFaceCapture}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  className="flex-1 bg-transparent cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 cursor-pointer"
                  onClick={handleVerifyId}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Face Capture */}
        {showFaceCapture && (
          <div className="relative w-full h-[calc(100%-32px)] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex flex-col">
            {!capturedImage && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full flex-1 object-cover rounded-xl"
              />
            )}
            {/* Green dotted box */}
            {!capturedImage && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "90%",
                  height: "90%",
                  transform: "translate(-50%, -50%)",
                  border: "3px dotted limegreen",
                  borderRadius: "8px",
                  pointerEvents: "none",
                }}
              />
            )}
            {/* overlays */}
            {countdown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                <div className="text-6xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}
            {warning && !capturedImage && !isProcessing && (
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <p className="bg-red-600 text-white text-sm px-3 py-1 rounded-lg inline-block">
                  {warning}
                </p>
              </div>
            )}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                <div className="text-center text-white">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Verifying Identity...</p>
                  <p className="text-sm opacity-80">
                    This may take a few moments
                  </p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

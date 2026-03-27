"use client"

import { SignJWT } from "jose";
import { useState, useEffect} from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Scan, CheckCircle, Building2, Users, Globe, Lock } from "lucide-react"
import { EmiratesIdDialog } from "@/components/emirates-id-dialog"
import { CameraCapture } from "@/components/camera-capture"
import { SuccessScreen } from "@/components/success-screen"
import { useSearchParams, useRouter } from "next/navigation";


type LoginStep = "initial" | "emirates-id" | "camera" | "success" | "loading"


export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState<LoginStep>("loading")
  const [emiratesId, setEmiratesId] = useState("")

// ✅ Check session on mount
 useEffect(() => {
   const token = localStorage.getItem("uaeFaceAccessToken")
   if (token) {
     setCurrentStep("success")
   } else {
     setCurrentStep("initial")
   }
 }, [])

// Load your private key (PEM format)
async function loadPrivateKey() {
  const pem = await fetch("/uae-banking-services/privatekey.pem").then(res => res.text()); 
  const key = await crypto.subtle.importKey(
    "pkcs8",
    str2ab(pem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    true,
    ["sign"]
  );
  return key;
}


// Convert PEM string to ArrayBuffer
function str2ab(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/[\r\n]+/g, ""); // safer: strip both \r and \n

  const raw = atob(b64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);

  return buffer.buffer;
}


const handleUAEIDLogin = async () => {
  localStorage.setItem("loginInitiated", "true");
  const clientId = "dBJvVPvUAOKIpgk15L0yRcYc1xUTSwB1g115SLDSNk4hR87H";
  const redirectUri = "https://stg.uaeid.icp.gov.ae/uae-banking-services/handleRedirect";
  const scopes = "uaeid:idp:basic:profile";
  const state = "2e209679d474cd24a36206ac2dd8294d59";

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: clientId,
    aud: "https://stg.uaeid.icp.gov.ae/idp",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    nonce: "511f0d1b98f1a047f1b97edda0533500c4",
    state: state,
    iat: now,
    nbf: now,
    exp: now + 60 * 60,
    jti: crypto.randomUUID(),
  };

  // Load private key
  const privateKey = await loadPrivateKey();

  // Sign JWT with RS256
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(privateKey);

  // Redirect with request JWT
  const idpUrl = `https://stg.uaeid.icp.gov.ae/idp/authorization?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(
    scopes
  )}&state=${state}&nonce=511f0d1b98f1a047f1b97edda0533500c4&request=${token}`;


  console.log(idpUrl);
	var w = 480;
	var h = 300;

	// Position on the right side with 50px margin
	var left = screen.width - w - 50;
	var top = (screen.height / 2) - (h / 2);
	
	//var w = Math.floor(screen.width * 0.5);   // 50% of screen width
//var h = Math.floor(screen.height * 0.7);  // 70% of screen height

//var left = (screen.width - w) / 2;
//var top = (screen.height - h) / 2;

	// window.open(
	//   idpUrl,
	//   'idpLoginPopup',
	//   'width=' + w +
	//   ',height=' + h +
	// ',top=' + top +
	//   ',left=' + left +
	//  ',resizable=no,scrollbars=yes,toolbar=no,menubar=no'
	// );
	
  window.location.href = idpUrl;


};




  const handleEmiratesIdSubmit = (id: string) => {
    setEmiratesId(id)
    setCurrentStep("camera")
  }

  const handleCameraSuccess = () => {
    setCurrentStep("success")
  }

  const handleBackToLogin = async () => {
    try {
        // Make the logout API call
        setEmiratesId("");
        
        setCurrentStep("initial");
                    localStorage.removeItem("uaeFaceAccessToken");
        window.location.href=`https://stg.uaeid.icp.gov.ae/idp/logout?redirect_uri=https://stg.uaeid.icp.gov.ae/uae-banking-services`;
    

    } catch (error) {
        console.error("Error during logout:", error);
        // Optionally show an alert
        alert("Logout failed. Please try again.");
    }
};


  if (currentStep === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }


  if (currentStep === "success") {
    return <SuccessScreen onBackToLogin={handleBackToLogin} />
  }

  if (currentStep === "camera") {
    return <SuccessScreen onBackToLogin={handleBackToLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-semibold text-foreground">Login with UAEID</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>UAE Digital Services</span>
              <span>•</span>
              <span>Secure Portal</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/3 to-primary/8 p-12 items-center border-r border-border">
          <div className="max-w-lg">
            <div className="mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">UAE Digital Banking & Services</h1>
              <p className="text-xl text-muted-foreground text-pretty">
                Access your government services, banking, and digital identity with advanced biometric security.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/15">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Trusted by Millions</h3>
                  <p className="text-muted-foreground text-sm">
                    Over 5 million UAE residents use our secure platform daily
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/15">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Bank-Grade Security</h3>
                  <p className="text-muted-foreground text-sm">
                    Military-grade encryption and biometric authentication
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/15">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Government Approved</h3>
                  <p className="text-muted-foreground text-sm">
                    Officially certified by UAE Digital Government Authority
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-card rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Users Today</span>
                <span className="text-primary font-semibold">2,847,392</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center float-animation border border-primary/20">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">Secure Access Portal</h2>
              <p className="text-muted-foreground text-pretty">Login to access your digital services and banking</p>
            </div>

            <Card className="border-border bg-card shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-card-foreground">Welcome Back</CardTitle>
                <CardDescription>Authenticate with your Emirates ID and face</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* UAEID Face Login Button */}
                <Button
                  onClick={handleUAEIDLogin}
                  className="w-full h-14 text-lg font-medium pulse-glow bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
                  size="lg"
                >
                  <Scan className="w-5 h-5 mr-3" />
                  Login with UAEID
                </Button> 

                {/* Features */}
                <div className="pt-6 space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 mr-3 text-primary" />
                    Secure UAEID verification
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 mr-3 text-primary" />
                    Advanced facial recognition
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 mr-3 text-primary" />
                    Government-grade security
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8 text-sm text-muted-foreground">
              <p>Powered by UAE Digital Government • ISO 27001 Certified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emirates ID Dialog */}
      <EmiratesIdDialog
        open={currentStep === "emirates-id"}
        onClose={() => setCurrentStep("initial")}
        onSubmit={handleEmiratesIdSubmit}
      />
    </div>
  )
}

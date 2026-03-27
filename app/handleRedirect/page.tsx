"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HandleRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      const url = new URL(window.location.href)
      const authCode = url.searchParams.get("code")
      console.log("Handle Redirect")
      if (!authCode) {
        return
      }

      try {
        const tokenResponse = await fetch(
          "https://stg.uaeid.icp.gov.ae/idp/api/Authentication/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": "Basic ZEJKdlZQdlVBT0tJcGdrMTVMMHlSY1ljMXhVVFN3QjFnMTE1U0xEU05rNGhSODdIOlBuRUk5b1lwNWxPOFZLUzBCaWl5Z2dhVDExM29xcUVJTWxFb0VRcXZvOEVhREM4VFBoTFNZbk82eHo5UTliZlU=",
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
        console.log("TOKENdATA",tokenData)
        const accessToken = tokenData?.access_token

        localStorage.setItem("uaeFaceIdToken",tokenData?.id_token);

        if (!accessToken) throw new Error("No access token received")

        localStorage.setItem("uaeFaceAccessToken", accessToken)
        localStorage.removeItem("loginInitiated")
        setTimeout(() => {
            localStorage.removeItem("uaeFaceAccessToken");
            localStorage.removeItem("uaeFaceAccessTokenExpiry");
            }, 60 * 60 * 1000); // 1 hour

        // ✅ Redirect to outer LoginPage
       if (window.opener) {
          // Redirect parent and close popup
          window.opener.location.href = "/"
          window.close()
        } else {
          // Normal redirect inside same window  demo-uae-banking-services
          router.replace("/")
        }
      } catch (err) {
        console.error("Error exchanging code:", err)
      }
    }

    handleRedirect()
  }, [])

  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-white rounded-full animate-spin"></div>
      </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import swal from "sweetalert";
import {
  CheckCircle,
  User,
  Shield,
  Clock,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Home,
  Activity,
  Calendar,
  MapPin,
} from "lucide-react"

interface SuccessScreenProps {
  onBackToLogin: () => void
}

interface UserProfile {
  name: string
  gender: string
  phone: string
  email: string
  id_document_number: string
  country: string
    profile_image?: string
  nationality:string
  passport:string
}

export function SuccessScreen({ onBackToLogin }: SuccessScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true) // new state


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch user profile from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const accessToken = localStorage.getItem("uaeFaceAccessToken")
        if (!accessToken) {
          console.error("No access token found in localStorage")
          swal({
            title: "Error",
            text: "Access token not found",
            icon: "error",
            buttons: ["Cancel", "Retry"],
          }).then((retry) => {
            if (retry) fetchUserProfile()
            else onBackToLogin()
          })
          return
        }
        setIsLoading(true)
        // Fetch user profile
        const profileResponse = await fetch(
          "https://stg.uaeid.icp.gov.ae/idp/api/UserInfo/userinfo",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        )

        // Fetch user image
		/*
        const imageResponse = await fetch(
          "https://offredhat.digitaltrusttech.com/idp/api/UserInfo/GetUserImage",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              UgPassAuthorization: `Bearer ${accessToken}`,
            },
          }
        )
*/
       if (profileResponse.status === 401) {
  console.error("Error unauthorized");
  swal("Unauthorized", "Please Login back", "error")
    .then(() => {
      onBackToLogin();
    });
  return;
}
        if (!profileResponse.ok) {
          const errorData = await profileResponse.json().catch(() => null)
          const errorMessage = errorData?.message || profileResponse.statusText
          throw new Error(`${errorMessage}`)
        }

/*
        if (!imageResponse.ok) {
          const errorData = await imageResponse.json().catch(() => null)
          const errorMessage = errorData?.message || imageResponse.statusText
          throw new Error(`${errorMessage}`)
        }
		
		*/

        const profileData = await profileResponse.json()
       // const imageData = await imageResponse.json()
/*
        if (imageData?.success === false) {
          throw new Error(imageData?.message)
        }
		
		*/

        const profile = profileData.daes_claims || profileData; // fallback if no 'daes_claims'
		
		/*
        const profileImage = imageData?.result
          ? `data:image/jpeg;base64,${imageData.result}`
          : undefined
		  
		  */	

		console.log(profile)

        if (profile) {
          setUserProfile({
            name: profile.fullnameEN,
            gender: profile.gender,
            phone: profile.phone,
            email: profile.email,
              id_document_number: normalizeValue(profile.idn),
              passport: normalizeValue(profile.passportNumber),
            country: profile.country,
              profile_image: undefined, // fallback if no image
              nationality: profile.nationalityEN,
          })
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        swal({
          title: "Error fetching user profile",
          text: String(error) || "An unexpected error occurred",
          icon: "error",
          buttons: ["Cancel", "Retry"],
        }).then((retry) => {
          if (retry) fetchUserProfile()
          else onBackToLogin()
        })
      }
      finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

    const normalizeValue = (value?: string) => {
        if (!value) return ""
        const v = value.trim().toLowerCase()
        if (v === "null" || v === "undefined" || v === "n/a") return ""
        return value.trim()
    }


  const quickActions = [
    { icon: FileText, label: "Documents", count: 12, color: "bg-blue-500/20 text-blue-400" },
    { icon: CreditCard, label: "Services", count: 8, color: "bg-green-500/20 text-green-400" },
    { icon: Calendar, label: "Appointments", count: 3, color: "bg-purple-500/20 text-purple-400" },
    { icon: Activity, label: "Applications", count: 5, color: "bg-orange-500/20 text-orange-400" },
  ]

  const recentActivities = [
    { action: "Document Verified", time: "2 hours ago", status: "completed" },
    { action: "Service Request Submitted", time: "1 day ago", status: "pending" },
    { action: "Profile Updated", time: "3 days ago", status: "completed" },
  ]


  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">UAEID Banking & Services</h1>
                  <p className="text-xs text-muted-foreground">Digital Government Services</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{formatTime(currentTime)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(currentTime)}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button className="cursor-pointer" variant="ghost" size="sm" onClick={onBackToLogin}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground">Login Successful!</h2>
                    <p className="text-muted-foreground">
                      Welcome back to your UAEID Banking & Services. Your identity has been verified successfully.
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-primary/20">
                      {userProfile?.profile_image ? (
                        <img src={userProfile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground">{userProfile?.name || "Loading..."}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const gender = userProfile?.gender?.toUpperCase();
                          if (gender === "M") return "Male";
                          if (gender === "F") return "Female";
                          return userProfile?.gender || "";
                        })()}
                      </p>

                      {userProfile?.id_document_number?.trim() && (
                        <p className="text-xs text-muted-foreground">
                          Emirates ID Number: {userProfile.id_document_number}
                        </p>
                      )}

                      {userProfile?.passport?.trim() && (
                        <p className="text-xs text-muted-foreground">
                          Passport Number: {userProfile.passport}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Nationality: {userProfile?.nationality || ""}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {userProfile?.country || ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Login:</span>
                      <span className="text-foreground">{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="w-5 h-5 text-primary" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>Access your most used services and documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-accent/50"
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}>
                          <action.icon className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.count} items</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your latest interactions with government services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${activity.status === "completed" ? "bg-green-400" : "bg-yellow-400"
                            }`}
                        ></div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          activity.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Powered by UAE Digital Government • Secure • Trusted • Efficient
            </p>
          </div>
        </main>
      </div>

      {/* Loader overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-white rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}




    </div>
  )
}

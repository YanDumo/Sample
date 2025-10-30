import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { RoleSetup } from "./components/RoleSetup";
import { AdminDashboard } from "./components/AdminDashboard";
import { UserDashboard } from "./components/UserDashboard";
import { Toaster } from "sonner";
import { useState } from "react";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏥 VetCare</h1>
              <p className="text-gray-600">Veterinary Management System</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      
      <Authenticated>
        <AuthenticatedApp 
          key={refreshKey} 
          onProfileCreated={() => setRefreshKey(prev => prev + 1)} 
        />
      </Authenticated>
    </main>
  );
}

function AuthenticatedApp({ onProfileCreated }: { onProfileCreated: () => void }) {
  const userProfile = useQuery(api.userProfiles.getCurrentUserProfile);

  // Show loading state
  if (userProfile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show role setup if no profile exists
  if (userProfile === null) {
    return <RoleSetup onComplete={onProfileCreated} />;
  }

  // Show appropriate dashboard based on role
  return (
    <div className="min-h-screen">
      {/* Sign out button - fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <SignOutButton />
      </div>

      {userProfile.role === "admin" ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}

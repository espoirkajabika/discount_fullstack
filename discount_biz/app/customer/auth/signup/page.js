"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/CustomerAuthContext";

// Import UI components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { EyeOff, Eye, Lock, Mail, User, Phone, Tag } from "lucide-react";

export default function CustomerSignup() {
  const router = useRouter();
  const { signUp, isLoggedIn } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  const [activeTab, setActiveTab] = useState("account");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/customer");
    }
  }, [isLoggedIn, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setActiveTab("account");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setActiveTab("account");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...dataToSend } = formData;

      const result = await signUp(dataToSend);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect to login page with success message
      router.push("/customer/auth/login?registered=true");
    } catch (err) {
      setError("Failed to sign up. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8">
      <div className="w-full max-w-lg px-4">
        <div className="mb-8 text-center">
          <Link
            href="/customer"
            className="inline-flex items-center justify-center"
          >
            <Tag className="h-10 w-10 text-blue-600" />
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-1 text-gray-500">
            Join SaverSpot to discover and save on great deals
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign up</CardTitle>
            <CardDescription>
              Enter your details to create an account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Tabs
                defaultValue="account"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-700 font-semibold"
                    >
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-gray-700 font-semibold"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword.password ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("password")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showPassword.password ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-gray-700 font-semibold"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={
                            showPassword.confirmPassword ? "text" : "password"
                          }
                          autoComplete="new-password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("confirmPassword")
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showPassword.confirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("profile")}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="first_name"
                        className="text-gray-700 font-semibold"
                      >
                        First Name
                      </Label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <Input
                          id="first_name"
                          name="first_name"
                          type="text"
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder="John"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="last_name"
                        className="text-gray-700 font-semibold"
                      >
                        Last Name
                      </Label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <Input
                          id="last_name"
                          name="last_name"
                          type="text"
                          value={formData.last_name}
                          onChange={handleChange}
                          placeholder="Smith"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone_number"
                      className="text-gray-700 font-semibold"
                    >
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="+1 (234) 567-8901"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Your phone number is optional and helps with account
                      recovery
                    </p>
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("account")}
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/customer/auth/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerBusinessUser } from "@/lib/auth";
import AddressAutocomplete from "@/components/AddressAutocomplete";

// Import shadcn components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Icons
import {
  EyeOff,
  Eye,
  Lock,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function BusinessSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // User fields
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",

    // Business fields
    business_name: "",
    business_description: "",
    business_address: "",
    business_phone: "",
    business_website: "",
    avatar_url: "",
    business_hours: null,
    category_id: null,
    // Location fields
    latitude: null,
    longitude: null,
    formatted_address: "",
    place_id: "",
    address_components: null,
  });

  // FIXED: Handle location data properly, including null case
  const handleLocationSelect = (locationData) => {
    if (locationData === null) {
      // Clear all location-related fields when address is cleared
      setFormData((prev) => ({
        ...prev,
        business_address: "",
        formatted_address: "",
        latitude: null,
        longitude: null,
        place_id: "",
        address_components: null,
      }));
    } else {
      // Set location data when address is selected
      setFormData((prev) => ({
        ...prev,
        business_address: locationData.address,
        formatted_address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        place_id: locationData.place_id,
        address_components: locationData.address_components,
      }));
    }
  };

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"
        }/categories/`
      );
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      category_id: value,
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

    if (!formData.email || !formData.business_name) {
      setError("Email and business name are required");
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
    setError('');

    try {
      // Prepare data for API (remove confirmPassword and format for API)
      const { confirmPassword, ...dataToSend } = formData;
      
      // Helper function to clean null-like values
      const cleanValue = (value) => {
        if (value === null || value === undefined || value === "" || value === "null" || value === "undefined") {
          return null;
        }
        return value;
      };
      
      // Clean all location-related fields
      const cleanedData = {
        email: dataToSend.email,
        password: dataToSend.password,
        first_name: cleanValue(dataToSend.first_name),
        last_name: cleanValue(dataToSend.last_name),
        phone: cleanValue(dataToSend.phone),
        
        // Business fields
        business_name: dataToSend.business_name,
        business_description: cleanValue(dataToSend.business_description),
        business_address: cleanValue(dataToSend.business_address),
        business_phone: cleanValue(dataToSend.business_phone),
        business_website: cleanValue(dataToSend.business_website),
        avatar_url: cleanValue(dataToSend.avatar_url),
        business_hours: cleanValue(dataToSend.business_hours),
        category_id: cleanValue(dataToSend.category_id),
        
        // Location fields - ensure they're properly null if not set
        latitude: cleanValue(dataToSend.latitude),
        longitude: cleanValue(dataToSend.longitude),
        formatted_address: cleanValue(dataToSend.formatted_address),
        place_id: cleanValue(dataToSend.place_id),
        address_components: cleanValue(dataToSend.address_components),
        
        // Phone number mapping
        phone_number: cleanValue(dataToSend.business_phone) || cleanValue(dataToSend.phone),
      };

      // Remove fields that are null to avoid validation issues
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === null || cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      const result = await registerBusinessUser(cleanedData);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Success - redirect to dashboard or login
        router.push('/auth/login?message=Account created successfully');
      }
      
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress based on active tab
  const getProgress = () => {
    switch (activeTab) {
      case "account":
        return 33;
      case "business":
        return 66;
      case "details":
        return 100;
      default:
        return 33;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Discount Business
          </h1>
          <p className="text-gray-600">
            Create your business account and start offering deals
          </p>
        </div>

        <Card className="rounded-2xl shadow-xl bg-white border-0">
          <CardHeader className="px-8 pt-8 pb-4 text-center">
            <CardTitle className="text-2xl font-bold mb-2 text-gray-900">
              Create Business Account
            </CardTitle>
            <CardDescription className="text-gray-600 mb-4">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-green-600 font-semibold hover:text-green-700 hover:underline"
              >
                Sign in
              </Link>
            </CardDescription>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto">
              <Progress value={getProgress()} className="h-2 bg-gray-200" />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span
                  className={
                    activeTab === "account" ? "text-green-600 font-medium" : ""
                  }
                >
                  Account
                </span>
                <span
                  className={
                    activeTab === "business" ? "text-green-600 font-medium" : ""
                  }
                >
                  Business
                </span>
                <span
                  className={
                    activeTab === "details" ? "text-green-600 font-medium" : ""
                  }
                >
                  Details
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {error && (
              <Alert
                variant="destructive"
                className="mb-6 bg-red-50 border-red-200"
              >
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Tabs
                defaultValue="account"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="account"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger
                    value="business"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Business
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="first_name"
                        className="text-gray-700 font-semibold text-sm"
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
                          placeholder="Your first name"
                          className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="last_name"
                        className="text-gray-700 font-semibold text-sm"
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
                          placeholder="Your last name"
                          className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Email address *
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
                        placeholder="Enter your email"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Your phone number"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-gray-700 font-semibold text-sm"
                      >
                        Password *
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
                          placeholder="Create a password"
                          className="pl-10 pr-12 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("password")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                        className="text-gray-700 font-semibold text-sm"
                      >
                        Confirm Password *
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
                          placeholder="Confirm your password"
                          className="pl-10 pr-12 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("confirmPassword")
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

                  <div className="flex justify-end mt-8">
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 rounded-lg"
                      onClick={() => setActiveTab("business")}
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="business_name"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Business Name *
                    </Label>
                    <div className="relative">
                      <Building2
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="business_name"
                        name="business_name"
                        type="text"
                        required
                        value={formData.business_name}
                        onChange={handleChange}
                        placeholder="Enter your business name"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="business_description"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Business Description
                    </Label>
                    <Textarea
                      id="business_description"
                      name="business_description"
                      rows={4}
                      value={formData.business_description}
                      onChange={handleChange}
                      placeholder="Describe your business..."
                      className="bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="category_id"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Business Category
                    </Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="business_phone"
                        className="text-gray-700 font-semibold text-sm"
                      >
                        Business Phone
                      </Label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <Input
                          id="business_phone"
                          name="business_phone"
                          type="tel"
                          value={formData.business_phone}
                          onChange={handleChange}
                          placeholder="Business phone number"
                          className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="business_website"
                        className="text-gray-700 font-semibold text-sm"
                      >
                        Website
                      </Label>
                      <div className="relative">
                        <Globe
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <Input
                          id="business_website"
                          name="business_website"
                          type="url"
                          placeholder="https://example.com"
                          value={formData.business_website}
                          onChange={handleChange}
                          className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="px-8 h-12 rounded-lg border-gray-200 hover:bg-gray-50"
                      onClick={() => setActiveTab("account")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 rounded-lg"
                      onClick={() => setActiveTab("details")}
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <AddressAutocomplete
                      value={formData.business_address}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          business_address: value,
                        }))
                      }
                      onLocationSelect={handleLocationSelect}
                      placeholder="Enter your business address"
                      required={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="avatar_url"
                      className="text-gray-700 font-semibold text-sm"
                    >
                      Business Logo URL
                    </Label>
                    <div className="relative">
                      <Globe
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <Input
                        id="avatar_url"
                        name="avatar_url"
                        type="url"
                        value={formData.avatar_url}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.jpg"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="px-8 h-12 rounded-lg border-gray-200 hover:bg-gray-50"
                      onClick={() => setActiveTab("business")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <>
                          Create Account
                          <Building2 className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
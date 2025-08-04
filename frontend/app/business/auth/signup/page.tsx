"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerBusiness } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
// import AddressAutocomplete from '@/components/AddressAutocomplete'

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
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
  Target,
  CheckCircle,
} from "lucide-react";

export default function BusinessSignup() {
  const router = useRouter();
  const { login } = useAuth();

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

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  // Load categories on component mount
  useEffect(() => {
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
      category_id: value ? parseInt(value) : null,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleLocationSelect = (locationData) => {
    if (locationData === null) {
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
    setError("");
    setIsLoading(true); // ✅ Changed from setLoading to setIsLoading

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.business_name) {
        setError("Please fill in all required fields");
        setIsLoading(false); // ✅ Changed from setLoading to setIsLoading
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false); // ✅ Changed from setLoading to setIsLoading
        return;
      }

      // Helper function to clean values
      const cleanValue = (value) => {
        if (value === "" || value === undefined) return null;
        return value;
      };

      // Prepare data for submission
      const dataToSend = {
        // User fields
        email: formData.email,
        password: formData.password,
        first_name: cleanValue(formData.first_name),
        last_name: cleanValue(formData.last_name),
        phone: cleanValue(formData.phone),

        // Business fields
        business_name: formData.business_name,
        business_description: cleanValue(formData.business_description),
        business_address: cleanValue(formData.business_address),
        business_phone: cleanValue(formData.business_phone),
        business_website: cleanValue(formData.business_website),
        avatar_url: cleanValue(formData.avatar_url),
        business_hours: cleanValue(formData.business_hours),
        category_id: formData.category_id ? parseInt(formData.category_id) : null, // Ensure integer

        // Location fields
        latitude: cleanValue(formData.latitude),
        longitude: cleanValue(formData.longitude),
        formatted_address: cleanValue(formData.formatted_address),
        place_id: cleanValue(formData.place_id),
        address_components: cleanValue(formData.address_components),

        // Phone number mapping
        phone_number:
          cleanValue(formData.business_phone) || cleanValue(formData.phone),
      };

      // Remove null fields
      Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });

      console.log("Submitting business registration:", dataToSend);

      const result = await registerBusiness(dataToSend);

      if (result.error) {
        setError(result.error);
      } else {
        console.log("Registration successful:", result);

        // Auto-login the user and redirect
        login(result.user, result.token);

        // Show success message
        if (result.message) {
          alert(result.message || "Registration successful!");
        }

        // Redirect to dashboard
        router.push("/business/dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false); // ✅ Changed from setLoading to setIsLoading
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
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f] flex">
      {/* Left Side - Desktop Only - Visual Content */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        <div className="w-full flex flex-col justify-center items-center p-12 text-white relative z-10">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#e94e1b] to-red-600">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">PopupReach</span>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-lg mb-8">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Launch Your Business on
              <span className="text-[#e94e1b]"> PopupReach</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of businesses using location-based marketing to
              grow their customer base and increase foot traffic.
            </p>
          </div>

          {/* Success Stats */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">
                2 min
              </div>
              <div className="text-sm text-blue-600">Average setup time</div>
            </div>
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">3x</div>
              <div className="text-sm text-blue-600">
                Increase in foot traffic
              </div>
            </div>
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">85%</div>
              <div className="text-sm text-blue-600">Customer retention</div>
            </div>
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">24/7</div>
              <div className="text-sm text-blue-600">Support available</div>
            </div>
          </div>
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="businessGrid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
                <circle cx="40" cy="40" r="2" fill="white" fillOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#businessGrid)" />
          </svg>
        </div>

        {/* Floating Icons */}
        <div className="absolute top-16 left-16 w-16 h-16 bg-[#e94e1b] bg-opacity-20 rounded-full flex items-center justify-center">
          <Target className="w-8 h-8 text-[#e94e1b]" />
        </div>
        <div className="absolute bottom-20 left-12 w-12 h-12 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="absolute top-1/4 right-16 w-14 h-14 bg-[#e94e1b] bg-opacity-15 rounded-full flex items-center justify-center">
          <TrendingUp className="w-7 h-7 text-[#e94e1b]" />
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-2xl">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 mb-4 text-white hover:text-[#e94e1b] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#e94e1b] to-red-600">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">PopupReach</span>
            </div>
          </div>

          <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div className="hidden lg:flex items-center justify-center space-x-2 mb-4">
                <Store className="w-7 h-7 text-[#e94e1b]" />
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Create Business Account
                </CardTitle>
              </div>
              <CardTitle className="lg:hidden text-2xl font-bold text-gray-900">
                Join PopupReach
              </CardTitle>

              <CardDescription className="text-gray-600 text-base">
                Already have an account?{" "}
                <Link
                  href="/business/auth/signin"
                  className="text-[#e94e1b] font-semibold hover:text-[#d13f16] hover:underline"
                >
                  Sign in
                </Link>
              </CardDescription>

              {/* Progress Bar */}
              <div className="w-full max-w-lg mx-auto mt-6">
                <Progress value={getProgress()} className="h-2 bg-gray-200" />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span
                    className={
                      activeTab === "account"
                        ? "text-[#e94e1b] font-medium"
                        : ""
                    }
                  >
                    Account
                  </span>
                  <span
                    className={
                      activeTab === "business"
                        ? "text-[#e94e1b] font-medium"
                        : ""
                    }
                  >
                    Business
                  </span>
                  <span
                    className={
                      activeTab === "details"
                        ? "text-[#e94e1b] font-medium"
                        : ""
                    }
                  >
                    Details
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6">
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

              <Tabs
                defaultValue="account"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="account"
                    className="data-[state=active]:bg-[#e94e1b] data-[state=active]:text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger
                    value="business"
                    className="data-[state=active]:bg-[#e94e1b] data-[state=active]:text-white"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Business
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-[#e94e1b] data-[state=active]:text-white"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="first_name"
                        className="text-gray-700 font-medium"
                      >
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="first_name"
                          name="first_name"
                          type="text"
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder="Your first name"
                          className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="last_name"
                        className="text-gray-700 font-medium"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Your last name"
                        className="h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-700 font-medium"
                    >
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="business@example.com"
                        className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-gray-700 font-medium"
                    >
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                        className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-gray-700 font-medium"
                      >
                        Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword.password ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="At least 6 characters"
                          className="pl-10 pr-12 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("password")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.password ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-gray-700 font-medium"
                      >
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={
                            showPassword.confirmPassword ? "text" : "password"
                          }
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          className="pl-10 pr-12 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("confirmPassword")
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.confirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      type="button"
                      className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-8 h-12 rounded-lg"
                      onClick={() => setActiveTab("business")}
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="business_name"
                      className="text-gray-700 font-medium"
                    >
                      Business Name *
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="business_name"
                        name="business_name"
                        type="text"
                        required
                        value={formData.business_name}
                        onChange={handleChange}
                        placeholder="Your Business Name"
                        className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="business_description"
                      className="text-gray-700 font-medium"
                    >
                      Business Description
                    </Label>
                    <Textarea
                      id="business_description"
                      name="business_description"
                      rows={3}
                      value={formData.business_description}
                      onChange={handleChange}
                      placeholder="Describe what your business does..."
                      className="border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="category_id"
                      className="text-gray-700 font-medium"
                    >
                      Business Category
                    </Label>
                    <Select
                      value={
                        formData.category_id
                          ? formData.category_id.toString()
                          : ""
                      } // ✅ Convert to string for display
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {" "}
                            {/* ✅ Convert to string */}
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
                        className="text-gray-700 font-medium"
                      >
                        Business Phone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="business_phone"
                          name="business_phone"
                          type="tel"
                          value={formData.business_phone}
                          onChange={handleChange}
                          placeholder="(555) 123-4567"
                          className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="business_website"
                        className="text-gray-700 font-medium"
                      >
                        Website
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="business_website"
                          name="business_website"
                          type="url"
                          placeholder="https://yourbusiness.com"
                          value={formData.business_website}
                          onChange={handleChange}
                          className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="px-8 h-12 rounded-lg border-gray-300 hover:bg-gray-50"
                      onClick={() => setActiveTab("account")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-8 h-12 rounded-lg"
                      onClick={() => setActiveTab("details")}
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="business_address"
                      className="text-gray-700 font-medium"
                    >
                      Business Address
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="business_address"
                        name="business_address"
                        type="text"
                        value={formData.business_address}
                        onChange={handleChange}
                        placeholder="123 Main St, City, State"
                        className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Add your business address to help customers find you
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="avatar_url"
                      className="text-gray-700 font-medium"
                    >
                      Business Logo URL
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="avatar_url"
                        name="avatar_url"
                        type="url"
                        value={formData.avatar_url}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.jpg"
                        className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">
                          You're almost done!
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Complete your profile to start creating promotions and
                          reaching customers.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="px-8 h-12 rounded-lg border-gray-300 hover:bg-gray-50"
                      onClick={() => setActiveTab("business")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-8 h-12 rounded-lg shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <>Create Business Account</>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Terms and Privacy */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>

              {/* Shopper Link */}
              <div className="mt-4">
                <p className="text-center text-sm text-gray-500">
                  Looking for deals as a shopper?{" "}
                  <Link
                    href="/shoppers/auth/signup"
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Sign up as Shopper
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Features */}
          <div className="lg:hidden mt-6 text-center">
            <p className="text-blue-200 text-sm mb-4">
              Join thousands of successful businesses
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-blue-100">
              <div className="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-lg font-bold text-[#e94e1b] mb-1">
                  2 min
                </div>
                <div>Setup time</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-lg font-bold text-[#e94e1b] mb-1">3x</div>
                <div>More customers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




// I made some changes to my database on supabase by changing some tables to use integers and not uuid (claimed_offers, categories, offers and saved_offers). I      │
// │   also did make some changes to the schema. Now on my frontend app signup page, I am getting this error "Validation errors - category_id: UUID input should be a    │
// │   string, bytes or UUID object"\                                                                                                                                    │
// │   I need you help to fix this error    
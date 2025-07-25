'use client'

import React, { useState } from 'react'
import { MapPin, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-[#1e3a5f] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#e94e1b] to-red-600">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PopupReach</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#" 
              className="text-[#e94e1b] hover:text-orange-300 transition-colors font-medium"
            >
              Home
            </a>
            <a 
              href="#" 
              className="text-white hover:text-[#e94e1b] transition-colors font-medium"
            >
              For Shoppers
            </a>
            <a 
              href="#" 
              className="text-white hover:text-[#e94e1b] transition-colors font-medium"
            >
              For Business
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-[#1e3a5f] bg-transparent"
            >
              Sign In
            </Button>
            <Button className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
              Sign Up
            </Button>
          </div>

          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-[#2a4d6e]">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#1e3a5f] text-white border-[#2a4d6e]">
              <SheetHeader>
                <SheetTitle className="text-white text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <a 
                  href="#" 
                  className="text-[#e94e1b] py-2 hover:text-orange-300 transition-colors font-medium"
                >
                  Home
                </a>
                <a 
                  href="#" 
                  className="text-white py-2 hover:text-[#e94e1b] transition-colors font-medium"
                >
                  For Shoppers
                </a>
                <a 
                  href="#" 
                  className="text-white py-2 hover:text-[#e94e1b] transition-colors font-medium"
                >
                  For Business
                </a>
                <div className="border-t border-[#2a4d6e] pt-4 mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full mb-2 border-white text-white hover:bg-white hover:text-[#1e3a5f] bg-transparent"
                  >
                    Sign In
                  </Button>
                  <Button className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white">
                    Sign Up
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
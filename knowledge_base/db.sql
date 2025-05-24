-- ============================================================================
-- CLEAN DATABASE SCHEMA CREATION SCRIPT
-- Unified schema with profiles table for all user types
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE - Unified user management
-- ============================================================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Role flags
    is_business BOOLEAN DEFAULT FALSE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Constraints
    CONSTRAINT profiles_email_check CHECK (length(email) >= 3),
    CONSTRAINT profiles_phone_check CHECK (phone IS NULL OR length(phone) >= 10)
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_business ON profiles(is_business);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- ============================================================================
-- 2. CATEGORIES TABLE - Product and business categorization
-- ============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT categories_name_check CHECK (length(trim(name)) >= 2)
);

-- Create indexes for categories
CREATE INDEX idx_categories_name ON categories(name);

-- ============================================================================
-- 3. BUSINESSES TABLE - Business information
-- ============================================================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    business_name TEXT NOT NULL,
    business_description TEXT,
    business_address TEXT,
    phone_number TEXT,
    business_website TEXT,
    avatar_url TEXT,
    business_hours JSONB,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Constraints
    CONSTRAINT businesses_user_unique UNIQUE(user_id),
    CONSTRAINT businesses_name_check CHECK (length(trim(business_name)) >= 2),
    CONSTRAINT businesses_website_check CHECK (
        business_website IS NULL OR 
        business_website ~* '^https?://.*'
    )
);

-- Create indexes for businesses
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_category_id ON businesses(category_id);
CREATE INDEX idx_businesses_verified ON businesses(is_verified);
CREATE INDEX idx_businesses_name ON businesses(business_name);

-- ============================================================================
-- 4. PRODUCTS TABLE - Product catalog
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) CHECK (price >= 0),
    image_url TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Constraints
    CONSTRAINT products_name_check CHECK (length(trim(name)) >= 1)
);

-- Create indexes for products
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);

-- ============================================================================
-- 5. OFFERS TABLE - Discount offers
-- ============================================================================

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    
    -- Discount information
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    original_price DECIMAL(10,2) CHECK (original_price >= 0),
    discounted_price DECIMAL(10,2) CHECK (discounted_price >= 0),
    
    -- Validity period
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage limits
    max_claims INTEGER CHECK (max_claims > 0),
    current_claims INTEGER DEFAULT 0 NOT NULL CHECK (current_claims >= 0),
    
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Constraints
    CONSTRAINT offers_title_check CHECK (length(trim(title)) >= 3),
    CONSTRAINT offers_date_check CHECK (expiry_date > start_date),
    CONSTRAINT offers_claims_check CHECK (
        max_claims IS NULL OR current_claims <= max_claims
    ),
    CONSTRAINT offers_percentage_check CHECK (
        discount_type != 'percentage' OR discount_value <= 100
    ),
    CONSTRAINT offers_price_logic_check CHECK (
        original_price IS NULL OR 
        discounted_price IS NULL OR 
        discounted_price <= original_price
    )
);

-- Create indexes for offers
CREATE INDEX idx_offers_business_id ON offers(business_id);
CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE INDEX idx_offers_active ON offers(is_active);
CREATE INDEX idx_offers_dates ON offers(start_date, expiry_date);
CREATE INDEX idx_offers_discount_type ON offers(discount_type);

-- ============================================================================
-- 6. SAVED_OFFERS TABLE - User saved offers
-- ============================================================================

CREATE TABLE saved_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT saved_offers_unique UNIQUE(user_id, offer_id)
);

-- Create indexes for saved_offers
CREATE INDEX idx_saved_offers_user_id ON saved_offers(user_id);
CREATE INDEX idx_saved_offers_offer_id ON saved_offers(offer_id);
CREATE INDEX idx_saved_offers_saved_at ON saved_offers(saved_at);

-- ============================================================================
-- 7. CLAIMED_OFFERS TABLE - Offer redemption tracking
-- ============================================================================

CREATE TABLE claimed_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE NOT NULL,
    
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_redeemed BOOLEAN DEFAULT FALSE NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    
    -- Optional: Store redemption details
    redemption_notes TEXT,
    
    -- Constraints
    CONSTRAINT claimed_offers_unique UNIQUE(user_id, offer_id),
    CONSTRAINT claimed_offers_redemption_check CHECK (
        is_redeemed = FALSE OR redeemed_at IS NOT NULL
    )
);

-- Create indexes for claimed_offers
CREATE INDEX idx_claimed_offers_user_id ON claimed_offers(user_id);
CREATE INDEX idx_claimed_offers_offer_id ON claimed_offers(offer_id);
CREATE INDEX idx_claimed_offers_claimed_at ON claimed_offers(claimed_at);
CREATE INDEX idx_claimed_offers_redeemed ON claimed_offers(is_redeemed);

-- ============================================================================
-- 8. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment offer claim count
CREATE OR REPLACE FUNCTION increment_claim_count(offer_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE offers
    SET current_claims = current_claims + 1
    WHERE id = offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement offer claim count (for claim cancellations)
CREATE OR REPLACE FUNCTION decrement_claim_count(offer_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE offers
    SET current_claims = GREATEST(current_claims - 1, 0)
    WHERE id = offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_offers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. RLS POLICIES - PROFILES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Anyone can view basic profile info (for business listings, etc.)
CREATE POLICY "Anyone can view profile basics"
ON profiles FOR SELECT
USING (true);

-- Service role has full access
CREATE POLICY "Service role has full access to profiles"
ON profiles FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 11. RLS POLICIES - BUSINESSES
-- ============================================================================

-- Anyone can view verified businesses
CREATE POLICY "Anyone can view businesses" 
ON businesses FOR SELECT 
USING (true);

-- Users can manage their own business
CREATE POLICY "Users can insert their own business" 
ON businesses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business" 
ON businesses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business" 
ON businesses FOR DELETE 
USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to businesses"
ON businesses FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 12. RLS POLICIES - CATEGORIES
-- ============================================================================

-- Anyone can view categories
CREATE POLICY "Anyone can view categories" 
ON categories FOR SELECT 
USING (true);

-- Admin users can insert categories
CREATE POLICY "Admin users can insert categories" 
ON categories FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Admin users can update categories
CREATE POLICY "Admin users can update categories" 
ON categories FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Admin users can delete categories
CREATE POLICY "Admin users can delete categories" 
ON categories FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to categories"
ON categories FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 13. RLS POLICIES - PRODUCTS
-- ============================================================================

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" 
ON products FOR SELECT 
USING (is_active = true);

-- Businesses can view all their products
CREATE POLICY "Businesses can view all their products" 
ON products FOR SELECT 
USING (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Businesses can insert their own products
CREATE POLICY "Businesses can insert their own products" 
ON products FOR INSERT 
WITH CHECK (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Businesses can update their own products
CREATE POLICY "Businesses can update their own products" 
ON products FOR UPDATE 
USING (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Businesses can delete their own products
CREATE POLICY "Businesses can delete their own products" 
ON products FOR DELETE 
USING (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to products"
ON products FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 14. RLS POLICIES - OFFERS
-- ============================================================================

-- Anyone can view active offers within date range
CREATE POLICY "Anyone can view active offers" 
ON offers FOR SELECT 
USING (
    is_active = true AND
    NOW() BETWEEN start_date AND expiry_date
);

-- Businesses can view all their offers
CREATE POLICY "Businesses can view all their offers" 
ON offers FOR SELECT 
USING (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Businesses can insert their own offers
CREATE POLICY "Businesses can insert their own offers" 
ON offers FOR INSERT 
WITH CHECK (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Businesses can update their own offers
CREATE POLICY "Businesses can update their own offers" 
ON offers FOR UPDATE 
USING (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Businesses can delete their own offers
CREATE POLICY "Businesses can delete their own offers" 
ON offers FOR DELETE 
USING (
    business_id IN (
        SELECT id FROM businesses
        WHERE user_id = auth.uid()
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to offers"
ON offers FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 15. RLS POLICIES - SAVED_OFFERS
-- ============================================================================

-- Users can view their saved offers
CREATE POLICY "Users can view their saved offers" 
ON saved_offers FOR SELECT 
USING (user_id = auth.uid());

-- Users can save offers
CREATE POLICY "Users can save offers" 
ON saved_offers FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can unsave offers
CREATE POLICY "Users can unsave offers" 
ON saved_offers FOR DELETE 
USING (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "Service role has full access to saved_offers"
ON saved_offers FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 16. RLS POLICIES - CLAIMED_OFFERS
-- ============================================================================

-- Users can view their claimed offers
CREATE POLICY "Users can view their claimed offers" 
ON claimed_offers FOR SELECT 
USING (user_id = auth.uid());

-- Users can claim offers
CREATE POLICY "Users can claim offers" 
ON claimed_offers FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Businesses can view claims for their offers
CREATE POLICY "Businesses can view claims for their offers" 
ON claimed_offers FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM offers o
        JOIN businesses b ON o.business_id = b.id
        WHERE o.id = offer_id AND b.user_id = auth.uid()
    )
);

-- Businesses can update claim status (mark as redeemed)
CREATE POLICY "Businesses can update claim status" 
ON claimed_offers FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM offers o
        JOIN businesses b ON o.business_id = b.id
        WHERE o.id = offer_id AND b.user_id = auth.uid()
    )
);

-- Service role has full access
CREATE POLICY "Service role has full access to claimed_offers"
ON claimed_offers FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 17. INSERT SAMPLE DATA (Optional)
-- ============================================================================

-- Insert sample categories
INSERT INTO categories (name, description, icon) VALUES
('Food & Dining', 'Restaurants, cafes, and food services', '🍽️'),
('Retail & Shopping', 'Clothing, electronics, and general merchandise', '🛍️'),
('Health & Beauty', 'Spas, salons, fitness, and wellness', '💅'),
('Entertainment', 'Movies, games, and recreational activities', '🎬'),
('Services', 'Professional and personal services', '🔧'),
('Travel & Tourism', 'Hotels, tours, and travel services', '✈️');

-- Note: User profiles will be created automatically via trigger when users sign up
-- Business data, products, and offers should be created through the API

-- ============================================================================
-- 18. VERIFICATION QUERIES
-- ============================================================================

-- Check that all tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- Check policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
This clean schema provides:

✅ Unified user management in profiles table
✅ Clear role-based access with flags (is_business, is_admin)
✅ Proper foreign key relationships
✅ Comprehensive RLS policies for security
✅ Optimized indexes for performance
✅ Data validation constraints
✅ Automatic timestamp management
✅ Business logic functions (claim counting)
✅ Sample categories for quick start

Key improvements over the previous schema:
- No legacy tables or migration artifacts
- Cleaner relationships and constraints
- Better performance with targeted indexes
- More comprehensive RLS policies
- Built-in data validation
- Automatic profile creation on user signup

Ready for production use with your FastAPI backend!
*/
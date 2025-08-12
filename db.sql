-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL CHECK (length(TRIM(BOTH FROM business_name)) >= 2),
  business_description text,
  business_address text,
  phone_number text,
  business_website text CHECK (business_website IS NULL OR business_website ~* '^https?://.*'::text),
  avatar_url text,
  business_hours jsonb,
  category_id integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_verified boolean NOT NULL DEFAULT false,
  latitude numeric,
  longitude numeric,
  formatted_address text,
  place_id character varying,
  address_components jsonb,
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name text NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM name)) >= 2),
  description text,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.claimed_offers (
  id bigint NOT NULL DEFAULT nextval('claimed_offers_id_seq'::regclass),
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  is_redeemed boolean NOT NULL DEFAULT false,
  redeemed_at timestamp with time zone,
  redemption_notes text,
  claim_type text DEFAULT 'in_store'::text CHECK (claim_type = ANY (ARRAY['online'::text, 'in_store'::text])),
  unique_claim_id text UNIQUE,
  qr_code_url text,
  merchant_redirect_url text,
  quantity integer DEFAULT 1 CHECK (quantity >= 1),
  batch_id uuid,
  notes text,
  CONSTRAINT claimed_offers_pkey PRIMARY KEY (id),
  CONSTRAINT claimed_offers_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id),
  CONSTRAINT claimed_offers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  product_id uuid,
  title text NOT NULL CHECK (length(TRIM(BOTH FROM title)) >= 3),
  description text,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'minimum_purchase'::text, 'quantity_discount'::text, 'bogo'::text])),
  discount_value numeric NOT NULL CHECK (discount_value >= 0::numeric),
  original_price numeric CHECK (original_price >= 0::numeric),
  discounted_price numeric CHECK (discounted_price >= 0::numeric),
  start_date timestamp with time zone NOT NULL,
  expiry_date timestamp with time zone NOT NULL,
  max_claims integer CHECK (max_claims > 0),
  current_claims integer NOT NULL DEFAULT 0 CHECK (current_claims >= 0),
  terms_conditions text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  minimum_purchase_amount numeric CHECK (minimum_purchase_amount >= 0::numeric),
  minimum_quantity integer CHECK (minimum_quantity > 0),
  buy_quantity integer CHECK (buy_quantity > 0),
  get_quantity integer CHECK (get_quantity > 0),
  get_discount_percentage numeric CHECK (get_discount_percentage >= 0::numeric AND get_discount_percentage <= 100::numeric),
  offer_parameters jsonb,
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL CHECK (length(TRIM(BOTH FROM name)) >= 1),
  description text,
  price numeric CHECK (price >= 0::numeric),
  image_url text,
  category_id integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL CHECK (length(email) >= 3),
  first_name text,
  last_name text,
  phone text CHECK (phone IS NULL OR length(phone) >= 10),
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_business boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.saved_offers (
  id bigint NOT NULL DEFAULT nextval('saved_offers_id_seq'::regclass),
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saved_offers_pkey PRIMARY KEY (id),
  CONSTRAINT saved_offers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT saved_offers_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id)
);
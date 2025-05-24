flowchart TD
    subgraph "Frontend Applications"
        customer[Customer Next.js App]
        business[Business Next.js App]
    end
    
    subgraph "Backend"
        fastapi[FastAPI Backend]
    end
    
    subgraph "Database"
        supabase[Supabase]
        supabase_auth[Supabase Auth]
        supabase_storage[Supabase Storage]
    end
    
    customer <--> fastapi
    business <--> fastapi
    fastapi <--> supabase
    fastapi <--> supabase_auth
    fastapi <--> supabase_storage
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export async function initializeDatabase() {
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  
  try {
    console.log("Initializing database...");
    
    // Create enum types first
    await client`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type') THEN
          CREATE TYPE company_type AS ENUM ('owner', 'partner', 'client', 'sub');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('owner', 'admin', 'client_services', 'specialty_skills', 'partner_admin', 'partner_contributor', 'partner_viewer', 'client_editor', 'client_viewer');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level') THEN
          CREATE TYPE access_level AS ENUM ('edit', 'view');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
          CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived', 'draft');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_status') THEN
          CREATE TYPE audit_status AS ENUM ('draft', 'review', 'published', 'archived');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_type') THEN
          CREATE TYPE access_type AS ENUM ('permanent', 'temporary');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consent_type') THEN
          CREATE TYPE consent_type AS ENUM ('gdpr', 'ai_usage', 'data_sharing');
        END IF;
      END$$;
    `;
    
    // Create tables
    await client`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type company_type NOT NULL,
        parent_id UUID REFERENCES companies(id),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255),
        logo_url TEXT,
        primary_color VARCHAR(7),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role user_role NOT NULL,
        tags TEXT[],
        google_id VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_company_id UUID REFERENCES companies(id) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status project_status DEFAULT 'active',
        created_by UUID REFERENCES users(id),
        settings JSONB DEFAULT '{}',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS project_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) NOT NULL,
        company_id UUID REFERENCES companies(id),
        user_id UUID REFERENCES users(id),
        access_level access_level NOT NULL,
        granted_by UUID REFERENCES users(id),
        granted_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS client_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_company_id UUID REFERENCES companies(id) NOT NULL,
        service_id UUID REFERENCES services(id) NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        configuration JSONB DEFAULT '{}',
        enabled_by UUID REFERENCES users(id),
        enabled_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS digital_audits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_company_id UUID REFERENCES companies(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        html_content TEXT,
        status audit_status DEFAULT 'draft',
        access_type access_type DEFAULT 'permanent',
        access_expires_at TIMESTAMP,
        created_by UUID REFERENCES users(id),
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS access_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_email VARCHAR(255) NOT NULL,
        requester_name VARCHAR(255) NOT NULL,
        company_id UUID REFERENCES companies(id),
        requested_role user_role NOT NULL,
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client`
      CREATE TABLE IF NOT EXISTS consent_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) NOT NULL,
        consent_type consent_type NOT NULL,
        status BOOLEAN NOT NULL,
        granted_by UUID REFERENCES users(id),
        ip_address VARCHAR(45),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Create initial data - Owner company
    const ownerCompanyResult = await client`
      INSERT INTO companies (type, name, domain)
      SELECT 'owner', 'Conveyor Marketing Group', 'conveyormarketing.com'
      WHERE NOT EXISTS (
        SELECT 1 FROM companies WHERE type = 'owner' AND name = 'Conveyor Marketing Group'
      )
      RETURNING id;
    `;
    
    // Create initial admin user if owner company was created
    if (ownerCompanyResult.length > 0) {
      const ownerCompanyId = ownerCompanyResult[0].id;
      
      await client`
        INSERT INTO users (company_id, email, password_hash, first_name, last_name, role)
        SELECT ${ownerCompanyId}, 'admin@conveyormarketing.com', '$2b$10$rGy.vK9k1hJ8r9K2J8e9l.FqYhWfqGfX5Y1fI2X3K4L5M6N7O8P9Q', 'Admin', 'User', 'owner'
        WHERE NOT EXISTS (
          SELECT 1 FROM users WHERE email = 'admin@conveyormarketing.com'
        );
      `;
    }
    
    console.log("Database initialized successfully!");
    
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}
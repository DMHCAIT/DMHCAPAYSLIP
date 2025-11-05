# Deployment Configuration for HRMS Pro

## Production Build
npm run build

## Environment Variables for Production
VITE_SUPABASE_URL=https://ekgeefocgwjvwxsrkhmd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZ2VlZm9jZ3dqdnd4c3JraG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAwODYsImV4cCI6MjA3Nzg0NjA4Nn0.F-D900VgbWhIfXSWzx5tCkj2qt-s-OPhq0k93t6GmAs

## Vercel Deployment
{
  "name": "hrms-pro",
  "version": 2,
  "builds": [
    { 
      "src": "package.json", 
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}

## Netlify Deployment
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
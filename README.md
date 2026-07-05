# WelfareBot Admin Panel

This is the private Admin Dashboard for the WelfareBot system, built with React and Vite. It is completely decoupled from the main public chatbot to ensure maximum security.

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`. 
*Note: Make sure your FastAPI backend is running on port 8000 so the admin panel can connect to the API.*

## Production Deployment (Render)

Because this is a static React application, you can deploy it on Render as a **Static Site** (which is completely free and highly optimized).

### Step-by-Step Render Setup

1. **Create a New Static Site**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** and select **Static Site**.
   - Connect your GitHub repository (`WELFARE_BOT_ADMIN-PANEL`).

2. **Configure the Service Settings**:
   - **Name**: `welfarebot-admin`
   - **Branch**: `main`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: 
     ```text
     dist
     ```

3. **Advanced Settings (Rewrites)**:
   Because this is a Single Page Application (SPA) using React Router, you must add a rewrite rule so direct links work properly:
   - Click **Advanced**
   - Under **Redirects/Rewrites**, add a rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`

4. **Deploy**:
   Click **Create Static Site**. Render will build the Vite app and serve it globally!

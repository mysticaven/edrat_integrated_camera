# AgriTrack Mobile

AgriTrack Mobile is a comprehensive, mobile-first web application designed for the modern farmer. It provides a powerful suite of tools to monitor, manage, and analyze farm operations, leveraging AI to deliver actionable insights and improve crop health and yield.

This application serves as a central hub for all farm-related data, from daily tasks and field health to in-depth analytics, all accessible from a user-friendly interface.

## Key Features

-   **Dashboard**: A centralized home screen providing at-a-glance information, including weather updates, urgent notifications, and upcoming tasks.
-   **Task Management**: A simple yet effective system to create, track, and manage daily farm tasks to ensure nothing is overlooked.
-   **3D Farm Visualization**: An interactive 3D model of your farm's terrain, offering a unique and immersive perspective of your land.
-   **2D Health Map**: A top-down map view where you can add pins to represent different fields, each showing vital statistics like health status, soil moisture, and plant state.
-   **Advanced Analytics**: A dedicated analytics page with interactive charts and filters. Track key metrics like soil temperature, moisture, sunlight, and canopy cover over time.
-   **AI-Powered Insights**: Integrated with Google's Gemini, the app analyzes your farm's data to provide expert insights, identify potential problems, and offer actionable solutions and recommendations.
-   **Secure User Management**: Features robust user authentication (email/password and Google sign-in), and profile management, all powered by Supabase.
-   **Customizable Profile**: Users can manage personal information and customize app settings, including notification preferences, language (English/Hindi), and theme (Light, Dark, Blue).

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **UI**: React 18, Tailwind CSS
-   **Component Library**: Shadcn/ui
-   **Backend & Database**: Supabase (Auth, Postgres)
-   **AI & Generative AI**: Genkit, Google Gemini
-   **3D Rendering**: Three.js
-   **Charting**: Recharts

## Getting Started

Follow these instructions to set up and run the project locally.

### 1. Install Dependencies

First, install the required NPM packages:

```bash
npm install
```

### 2. Set Up Environment Variables

Create a file named `.env.local` in the root of the project and add the following keys.

```env
# Get this from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Get this from Google AI Studio
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Set Up Supabase Database

The application relies on a Supabase database with specific tables for tasks, notifications, fields, and analytics.

1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  Navigate to the **SQL Editor**.
3.  Execute the `CREATE TABLE` statements found in the comments of the `src/lib/supabase.ts` file to create the necessary tables (`tasks`, `notifications`, `fields`, `analytics`).
4.  Optionally, run the sample `INSERT` statements from the same file to populate your database with placeholder data. **Remember to replace `'YOUR_USER_ID'` with your actual user ID from the `auth.users` table.**

### 4. Run the Application

Once the setup is complete, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## Troubleshooting

If you encounter issues with the 3D rendering components, particularly after installing packages, you may have conflicting versions of `@react-three/fiber`. Running the following command can resolve this:

```bash
npm install @react-three/fiber@alpha --legacy-peer-deps
```

This command installs a specific version of the library and helps bypass strict dependency conflicts that can occur in complex projects.

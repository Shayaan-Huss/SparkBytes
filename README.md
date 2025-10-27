-- sparkbytes -- 

# Next.js & Supabase Event Management App

This is a project built with Next.js, Ant Design, and Supabase. It includes features for viewing events and user authentication.

## Project Structure Overview

* **Home Page:** Landing page for the application.
* **Events Page:** Displays a list of events.
* **Sign In Page:** A standalone page for user authentication.

## Prerequisites

Before you begin, ensure you have the following installed:
* [Node.js](httpss://nodejs.org/en/) (v18.x or later recommended)
* [npm](httpss://www.npmjs.com/) or [yarn](httpss://yarnpkg.com/)

## Setup and Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone [your-repository-url]
    cd [your-project-directory]
    ```

2.  **Install Dependencies:**
    This project uses `next`, `react`, `react-dom`, `@supabase/supabase-js`, and `antd`.
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    This project requires a Supabase backend.
    * Find the `.env.example` file in the root directory.
    * Create a copy of it and name it `.env.local`.
    ```bash
    cp .env.example .env.local
    ```
    * Log in to your [Supabase project dashboard](httpss://app.supabase.com).
    * Navigate to **Project Settings** > **API**.
    * Find your **Project URL** and **Project API Keys** (the `anon` `public` key).
    * Update your `.env.local` file with these values:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

## Running the Development Server

1.  **Start the app:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

2.  **View the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the running application.

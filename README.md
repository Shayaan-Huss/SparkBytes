# SparkBytes! Group 5

This is a project built with Next.js, Ant Design, and Supabase. It includes features for viewing events and user authentication.

# Group 5 Project Goals
* Develop a full-stack web application enabling BU students and staff to discover and reserve free food from campus events, aiming to reduce food waste from over-purchasing
* Build an interactive and personalized front-end using React.js, JavaScript, and Figma, offering a tailored user experience based on account type (organizer or attendee)
* Integrate Supabase for backend services including user authentication, event creation permissions, and real-time data storage
* Implement secure authentication and role-based access control, allowing only verified organizers to post new events
* Design and test dynamic components with Jest, ensuring UI responsiveness and functionality across user flows
* Contribute to reducing food waste and promoting sustainability through data-driven event visibility and efficient food distribution.


## Project Structure Overview

* **Home Page:** Landing page for the application.
* **Events Page:** Displays a list of events.
* **Create Event Popup:** Allows a user to create an event and add food items.
* **Sign In Page:** A standalone page for user authentication.
* **Reserve Food:** Other students can reserve available food items in advance.
* **Secure Auth:** Implemented with Supabase Auth

| Tech | Purpose |
|------|---------|
| **React.js** | Frontend UI and interactivity |
| **TypeScript / JavaScript** | Language for frontend logic |
| **Supabase** | Backend: database, auth, real-time |
| **PostgreSQL** | Relational database for storing events, food, and user data |
| **Figma** | UI/UX design |
| **Tailwind CSS** | Styling and layout |
| **Jest** | Front-end testing |

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


## Impact
This project contributes to:
Reducing campus food waste
Increasing food accessibility
Promoting event attendance and sustainability

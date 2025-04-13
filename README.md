This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up Supabase for sound effect storage:

1. Create a [Supabase](https://supabase.com) account and start a new project.
2. In your Supabase project, create a new table called `sound_effects` with the following columns:
   - `id` (integer, primary key)
   - `user_id` (text, not null)
   - `name` (text, not null)
   - `category` (text, not null)
   - `description` (text)
   - `file` (text, not null)
   - `icon_type` (text, not null)
   - `icon_content` (text, not null)
   - `icon_color` (text)
   - `created_at` (timestamp with time zone, default: now())
3. Set up Row Level Security (RLS) policy to allow users to access only their own sound effects. Run each of these SQL statements in the Supabase SQL editor:

   ```
   -- Copy and run each policy statement separately
   CREATE POLICY "Users can view their own sound effects" ON sound_effects
   FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
   
   CREATE POLICY "Users can insert their own sound effects" ON sound_effects
   FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
   
   CREATE POLICY "Users can update their own sound effects" ON sound_effects
   FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);
   
   CREATE POLICY "Users can delete their own sound effects" ON sound_effects
   FOR DELETE USING (auth.uid() = user_id OR auth.uid() IS NULL);
   ```

4. Copy your Supabase URL and anon key from the project settings.
5. Create a `.env.local` file in the root of the project.
6. Add your Supabase credentials to the `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

- Browse and play sound effects
- Add custom sound effects with icons
- Categorize and organize your sound library
- Cloud storage with Supabase for cross-device access
- Dark/light mode theme
- Favorites system
- Import/export functionality

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

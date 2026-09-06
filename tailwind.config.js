/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      spacing: {
        // Tailwind's default scale jumps from 4 (1rem) to 5 (1.25rem) with
        // no 4.5 step, so `h-4.5`/`w-4.5` (used throughout the app for icon
        // badges) generated no CSS at all and those icons silently fell
        // back to their unsized default. Adding the step fixes every one
        // of those call sites at once.
        4.5: "1.125rem",
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#80acff",
          400: "#4d8bff",
          500: "#2568f5",
          600: "#1a4fd1",
          700: "#163fa8",
          800: "#15357f",
          900: "#122c63",
        },
        ink: {
          50: "#f5f6f8",
          100: "#e7e9ee",
          200: "#c6cbd7",
          300: "#9aa2b8",
          400: "#6b7590",
          500: "#4b5875",
          600: "#374260",
          700: "#252f49",
          800: "#182136",
          900: "#0f1626",
          950: "#0a0f1c",
        },
        brass: {
          50: "#fcf6e9",
          100: "#f7e9c5",
          200: "#eed28c",
          300: "#e2b558",
          400: "#cc9736",
          500: "#b8842e",
          600: "#966a22",
          700: "#78531c",
          800: "#5c3f16",
          900: "#432d10",
        },
        role: {
          superadmin: "#6d3fa8",
          superadminSoft: "#f2eafb",
          admin: "#1d4ed8",
          adminSoft: "#e9eefd",
          teacher: "#a9691c",
          teacherSoft: "#fbeeda",
          student: "#0f7a5d",
          studentSoft: "#e2f4ee",
        },
        paper: "#f6f7fa",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        // Boosted from the original near-invisible 0.04/0.12-opacity pass so
        // every ".card"/".stat-card"/".tile-card" surface reads as a clearly
        // lifted box at rest, not just on hover.
        card: "0 4px 10px rgba(15, 22, 38, 0.10), 0 18px 38px -12px rgba(15, 22, 38, 0.30)",
        panel: "0 24px 70px -18px rgba(15, 22, 38, 0.40)",
        gold: "0 24px 50px -16px rgba(184, 132, 46, 0.50)",
      },
    },
  },
  plugins: [],
};

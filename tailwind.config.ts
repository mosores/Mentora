import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Legacy light theme (kept for backward compat)
        ink: "#17202A",
        ocean: "#0E7490",
        mint: "#2DD4BF",
        coral: "#F97362",
        maize: "#F7C948",
        cloud: "#F7FAFC",
        // New dark theme palette
        brand: {
          indigo: "#6366F1",
          cyan: "#06B6D4",
          teal: "#2DD4BF",
          rose: "#F43F5E",
        },
        // Premium Mentora UI design colors
        mentora: {
          primary: "#6366F1",
          violet: "#8B5CF6",
          cyan: "#06B6D4",
          coral: "#FF6B5F",
          mint: "#10B981",
          soft: "#F8FAFC",
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 42, 0.12)",
        lift: "0 12px 30px rgba(14, 116, 144, 0.16)",
        "indigo-glow": "0 0 30px rgba(99, 102, 241, 0.25)",
        "cyan-glow": "0 0 25px rgba(6, 182, 212, 0.2)",
        // make-interfaces-feel-better: shadow-as-border scale
        "ring-line": "0 0 0 1px rgba(23, 32, 42, 0.08)",
        "ring-teal": "0 0 0 1px rgba(15, 118, 110, 0.14)",
        "xs-shadow": "0 1px 2px rgba(23, 32, 42, 0.04)",
        "sm-shadow": "0 2px 6px rgba(23, 32, 42, 0.06)",
        "md-shadow": "0 6px 18px rgba(23, 32, 42, 0.07)",
        "lg-shadow": "0 14px 40px rgba(23, 32, 42, 0.09)",
        "xl-shadow": "0 24px 60px rgba(23, 32, 42, 0.12)",
      },
      borderRadius: {
        // Concentric radius tokens: inner elements use smaller values
        "sm": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "20px",
        "2xl": "24px",
      },
      transitionTimingFunction: {
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "fast": "140ms",
        "base": "200ms",
        "slow": "320ms",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glow-indigo": "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "textShimmer 6s infinite linear",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      letterSpacing: {
        "0": "0",
      }
    }
  },
  plugins: []
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        iron: {
          black: "#07080a",
          panel: "#101318",
          panelLight: "#171b22",
          steel: "#8b97a8",
          copper: "#b87333",
          ember: "#f97316"
        }
      },
      boxShadow: {
        metal: "0 20px 50px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

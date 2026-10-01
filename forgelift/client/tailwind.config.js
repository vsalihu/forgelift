/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          black: "#07080a",
          panel: "#101318",
          panelLight: "#171b22",
          steel: "#8b97a8",
          copper: "#b87333",
          ember: "#f97316"
        }
      },
      // 12% sits between the default 10 and 15 steps and is used for hairline borders and tints.
      opacity: {
        12: "0.12"
      },
      boxShadow: {
        metal: "0 20px 50px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

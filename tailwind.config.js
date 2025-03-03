module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Asegúrate de que esta ruta coincida con la estructura de tu proyecto
  ],
  theme: {
    extend: {
      colors: {
        'custom-dark': '#001512',   // Fondo oscuro
        'custom-blue': '#04272D',   // Azul personalizado
        'custom-gray': '#8D9997',   // Gris claro
        'custom-white': '#FFFFFF',  // Blanco
        'custom-turquoise': '#02CDAD', // Turquesa
      },
      opacity: {
        '90': '0.9', // Agrega una opacidad del 90%
      },
    },
  },
  plugins: [],
};

import { type Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

const config: Config = {
  content: ['./index.html', 'src/**/*.vue'],
  plugins: [],
  theme: {
    colors: {
      brand: colors.sky,
      disabled: colors.neutral,
    },
  },
};

export default config;


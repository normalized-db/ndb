import { type Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

const config: Config = {
  content: ['./index.html', 'src/**/*.vue'],
  plugins: [],
  theme: {
    colors: {
      brand: colors.slate,
      disabled: colors.neutral,
      error: colors.red,
    },
  },
};

export default config;


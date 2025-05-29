module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,mdx,yaml,yml}': ['prettier --write'],
  '*.{ts,tsx,js,jsx,md,mdx,json}': ['cspell'],
};

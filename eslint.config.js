import js from '@eslint/js';
import globals from 'globals';

export default [
    { ignores: ['mobile/**', 'node_modules/**'] },
    js.configs.recommended,
    {
        files: ['server/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.node,
            sourceType: 'module',
        },
    },
];

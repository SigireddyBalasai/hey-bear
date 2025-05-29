module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type case
    'type-case': [2, 'always', 'lower-case'],

    // Type empty
    'type-empty': [2, 'never'],

    // Type enum
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'lint',
        'deps',
        'security',
      ],
    ],

    // Subject case
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],

    // Subject empty
    'subject-empty': [2, 'never'],

    // Subject full stop
    'subject-full-stop': [2, 'never', '.'],

    // Header max length
    'header-max-length': [2, 'always', 100],

    // Body leading blank
    'body-leading-blank': [1, 'always'],

    // Footer leading blank
    'footer-leading-blank': [1, 'always'],
  },
  ignores: [commit => commit.includes('WIP')],
};

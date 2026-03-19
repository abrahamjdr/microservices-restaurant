module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'gateway',
        'kitchen',
        'warehouse',
        'market',
        'ai',
        'frontend',
        'shared',
        'docker',
        'docs',
        'deps',
      ],
    ],
  },
};

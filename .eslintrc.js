module.exports = {
    'env': {
        'browser': true,
        'es2020': true
    },
    'extends': 'eslint-config-mdcs',
    'globals': {
      '__dev__': true
    },
    'parserOptions': {
        'ecmaVersion': 11,
        'sourceType': 'module'
    },
    'rules': {
        'indent': [ 'error', 2 ],
        'padded-blocks': ['error', {
            'blocks': 'never',
            'switches': 'never',
            'classes': 'never'
        }],
        'space-unary-ops': [ 'error', {
          'words': true, 'nonwords': false
        }]
    }
};

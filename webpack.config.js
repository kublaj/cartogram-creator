var getConfig = function (type) {

    var isDev = type === 'development';

    var config = {
        entry: './app/scripts/main.js',
        output: {
            path:'dist/js',
            filename: 'main.js'
        },
        debug: isDev,
        module: {
            loaders: [
                {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
            ]
        }
    };

    if (isDev) {
        config.devtool = 'eval';
    }

    return config;
};

module.exports =getConfig();
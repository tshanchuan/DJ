/**
 * Module dependencies.
 * 建立服务器
 */

var express = require('express'),   //导入Express模块
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    juicer = require('juicer'),
    fs = require('fs');
    //io = require('socket.io');


var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'html');
    app.engine('html',function(path,options,fn){         //利用juicer作为模版引擎
        fs.readFile(path, 'utf8', function (err, str) {
            if (err)
                return fn(err);
            str = juicer(str, options);
            fn(null, str);
        });
    });
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));//静态文件支持加缓存
    app.use(express.cookieParser());       //开启cookie
    app.use(app.router);
   /* app.use(express.session({              //开启session
        secret: config.session_secret
    }));*/
});

app.configure('development', function(){
    app.use(express.errorHandler());
});
app.configure('production', function () {
    app.use(express.errorHandler());
    app.set('view cache', true);
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

routes(app);
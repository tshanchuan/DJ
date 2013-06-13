/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-21
 * Time: 上午11:49
 * To change this template use File | Settings | File Templates.
 */

var http = require('http');
var querystring = require('querystring');
/*浅拷贝*/
var extend = function(result, source) {
    for (var key in source)
        result[key] = source[key];
    return result;
}
/*发送http请求*/
function send(data,options,callback) {
    var data = data;
    var opt= {
        host:'192.168.1.186',
        port:8080,
        path:'123',
        method:'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    };
    var o = extend(opt,options);
    var req = http.request(o, function (res) {
        var rec_leng = 0;
        var rec_ary = [];
        // res.setEncoding('utf8');
        res.on('error',function (e) {
            console.log("Got res error: " + e.message);
        }).on('data', function (chunk) {
                rec_leng += chunk.length;
                rec_ary.push(chunk);
                /*
                 * if(rec_leng > postLimit){
                 rec_ary = null;
                 req.connection.destroy()
                 }
                 * */
            }).on('end', function () {
                var buf =  Buffer.concat(rec_ary, rec_leng);
                var result = buf.toString();
                callback.call(this, result);
            });
    })
    req.on('error', function(e) {
        console.log(e)
        console.log("Got req error: " + e.message)
    })
    req.write(data + "\n");
    req.end();
}
exports.send = send
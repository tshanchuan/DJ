/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-16
 * Time: 下午7:13
 * To change this template use File | Settings | File Templates.
 */
/*逻辑层*/
var db = require('../modules/db'),
    config = require('../config').config,
    postData = require('../lib/postData'),
    crypto = require('crypto'),
    sha1 = require('sha1');
/*读取缓存*/
var redis = require("redis");
var check = require('validator').check,
    sanitize = require('validator').sanitize;
/*配置文件*/
var api = config.apiService //api入口
var vote = config.vote; //投票入口
var voteFeedback = config.voteFeedback; //投票反馈入口
var topicFeedback = config.voteFeedback; //话题反馈入口
var inserttrafficStatus = config.inserttrafficStatus; //插入路况快分享
var gettrafficStatus = config.gettrafficStatus; //得到路况快分享
var dj = config.queryBase; //dj库入口
var cityInfo = config.cityInfo,cityName="",cityCode="",radioStationName="",x="",y=""; //城市设置

/*处理空值*/
function nodata (str){
    if(str =="" || str == undefined ){
        str = 0;
    }
    return str;
}
/*注入*/
function handleParam(params) {
    var params = params || {};
    var safeParam = {};
    for (var key in params) {
        var trimed = sanitize(params[key]).xss();
        var blockXssed = sanitize(trimed).xss();
        safeParam[key] = blockXssed
    }
    return safeParam
}
//加密
function encrypt(str, secret) {
    var cipher = crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
}
//解密
function decrypt(str, secret) {
    var decipher = crypto.createDecipher('aes192', secret);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}
//sha1
function sha1(str) {
    sha1(str);
    return str;
}
//md5
function md5(str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}
/*得到随机字符串*/
function getRandomString(table, column) {
    var len = 15;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789';
    var maxPos = $chars.length;
    var id = '';
    for (i = 0; i < len; i++) {
        id += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT ' + column + ' FROM dj.' + table + ' where ' + column + '="' + id + '" limit 1';
    query.exec(sql, function (rows, fields) {
        if (rows != "") {
            id = getRandomString(table, column);
        }
    });
    query.end();
    return id;
}
//得到现在的时间
function getTimeNow() {
    var now = new Date();
    var theYear = now.getFullYear();
    var theMonth = now.getMonth() + 1;
    var theDay = now.getDate();
    var theHour = now.getHours();
    var theMinutes = now.getMinutes();
    var theSeconds = now.getSeconds();
    return timer = theYear + '-' + add0(theMonth) + '-' + add0(theDay) + ' ' + add0(theHour) + ':' + add0(theMinutes) + ':' + add0(theSeconds);
    function add0(num) {
        if (num < 10) {
            return "0" + num;
        } else {
            return num;
        }
    }
}
// /得到现在的小时
function getHour() {
    var now = new Date();
    var theHour = now.getHours();
    return add0(theHour);
    function add0(num) {
        if (num < 10) {
            return "0" + num;
        } else {
            return num;
        }
    }
}
//字典排序再散列器
function dictAndMd5ize(obj, secret) {
    var array = new Array();

    //字典排序

    for (var key in obj) {
        array.push(key);
    }
    array.sort();

    var paramArray = new Array();

    //拼接字符串

    for (var index in array) {
        var key = array[index];
        paramArray.push(key + obj[key]);
    }

    //md5化
    var md5Source = paramArray.join("");
    var sign = sha1(md5Source).toUpperCase();

    return sign;
}
//算字节 UTF-8
function substr(str, len)
{
    if( ! str || ! len)
    {
        return '';
    }
// 预期计数：中文3字节，英文1字节
    var a = 0;
// 循环计数
    var i = 0;
// 临时字串
    var temp = '';
    for (i = 0; i < str.length; i ++ )
    {
        if (str.charCodeAt(i) > 255)
        {
// 按照预期计数增加2
            a += 3;
        }
        else
        {
            a ++ ;
        }
// 如果增加计数后长度大于限定长度，就直接返回临时字符串
        if(a > len)
        {
            return temp;

        }
// 将当前内容加到临时字符串
        temp += str.charAt(i);
    }
// 如果全部是单字节字符，就直接返回源字符串
    return str;
}

/*返回值判断*/
function returnValue(res, code) {
    switch (code.ERRORCODE) {
        case '0':
            res.json({
                'ME' : '亲，活动发布成功！',
                'class' : 'text-success',
                'bizid' : code.RESULT["bizid"]
            });
            break;
        default:
            res.json({
                'ME' : '亲，活动发布失败！',
                'class' : 'text-error',
                'bizid' : '',
                'errorcode':code.ERRORCODE
            });
    }
}
/*浅拷贝,处理各种配置*/
var extend = function (result, source) {
    for (var key in source)
        result[key] = source[key];
    return result;
}
/*显示主页*/
exports.index = function (req, res) {
    cityName =  req.session.cityName;
    var operatorType = req.session.operatorType;
    radioStationName = req.session.radioStationName;
    var radioStationID = req.session.radioStationID;
    for(var i=0;i<cityInfo.city.length;i++){
        if(cityName == cityInfo.city[i].cityName){
            cityName = cityInfo.city[i].cityName;
            cityCode = cityInfo.city[i].cityCode;
            x =  cityInfo.city[i].x;
            y =  cityInfo.city[i].y;
        }else if(cityName ==""){
            cityName = "重庆市";
            radioStationName = "重庆交通广播";
            operatorType = "1";
            radioStationID = "FM95.5";
            cityCode = "500000";
            y = '29.533155';
            x = '106.504962';
        }
    }
    var city = {
        cityName:cityName,
        cityCode:cityCode,
        operatorType:operatorType,
        radioStationID:radioStationID
    }
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'INSERT INTO dj.initializationInfo (cityName,cityCode,time,operatorType,radioStationName,radioStationID) VALUES ("'+city.cityName+'","'+city.cityCode+'","'+getTimeNow()+'","'+operatorType+'","'+radioStationName+'","'+radioStationID+'")';
    query.exec(sql, function (rows, fields) {
        if (rows.fieldCount == 0) {
            var djrows = {
                "ERRORCODE" : "0",
                "RESULT" : null
            }
        } else {
            var djrows = {
                "ERRORCODE" : "ME01003",
                "RESULT" : null
            };
        }
    });
    query.end();
    res.render('index',{cityName:cityName,latitude:y,longitude:x,radioStationName:radioStationName});
};
exports.notFound = function (req, res, next) {
    res.render('404.html');
};
/*初始化DJ信息*/
exports.initDJ = function (req,res,next){
    var reqBody = handleParam(req.query); //得到POST的数据
    req.session.cityName =  reqBody.cityName;
    req.session.operatorType =  reqBody.operatorType;
    req.session.radioStationName =  reqBody.radioStationName;
    req.session.radioStationID =  reqBody.radioStationID;
    res.redirect('index');
}
/*发送投票/话题*/
exports.requestDistrictWeibo = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var content = reqBody.content; //投票内容
    var timer = reqBody.timers; //时间
    var sign = {
        agent : api.agent,
        allowYes : 1,
        cityCode : cityCode,
        interval : timer,
        districtWeiboType : 3,
        text : content,
        secret : api.secret,
        serviceType : api.serviceType
    };
    var signs = dictAndMd5ize(sign);
    var body = {
        agent : api.agent,
        allowYes : 1,
        cityCode : cityCode,
        interval : timer,
        districtWeiboType : 3,
        text : encodeURI(content),
        serviceType : api.serviceType,
        sign : signs
    };
    var data = JSON.stringify(body);
    postData.send(data, vote, function (result) {
        var code = JSON.parse(result);
        returnValue(res, code);
    });
}
/*保存投票*/
exports.requestsaveVote = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var data = {
        content : reqBody.content,
        time : getTimeNow(),
        bizid : reqBody.bizid,
        startTime : reqBody.startTime,
        endTime : reqBody.endTime,
        yesInfo : reqBody.yesInfo,
        noInfo : reqBody.noInfo,
        ignoreInfo : reqBody.ignoreInfo,
        voteId : getRandomString('voteInfo', 'voteid'), //生成十五位的随机码
        cityid : cityCode
    }
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'INSERT INTO dj.voteInfo (text,time,bizid,startTime,endTime,yesInfo,noInfo,ignoreInfo,voteid,cityCode) VALUES ("' + data.content + '","' + data.time + '","' + data.bizid + '","' + data.startTime + '","' + data.endTime + '","' + data.yesInfo + '","' + data.noInfo + '","' + data.ignoreInfo + '","' + data.voteId + '","' + data.cityid + '")';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    });
    query.end();
}
/*得到历史投票/话题并分页*/
exports.requestHistory = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var page = reqBody.page;
    var table = reqBody.table;
    table = table == 1 ? ('voteInfo') : ('topicInfo');
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * ,(SELECT count(id) FROM dj.'+table+' WHERE cityCode = '+cityCode+' ) as num FROM dj.' + table + ' WHERE cityCode = '+cityCode+' ORDER BY time DESC LIMIT ' + page + ',7';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*更新 投票/话题 的实际结束时间*/
exports.updateTime = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var actualEndTime = reqBody.actualEndTime;
    var table = reqBody.table;
    table = table == 1 ? ('voteInfo') : ('topicInfo');
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'UPDATE dj.' + table + ' SET actualEndTime = "' + actualEndTime + '" WHERE actualEndTime is null';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*显示历史投票详情*/
exports.showVoteHistory = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var id = reqBody.id;
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.voteInfo WHERE id=' + id;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*投票反馈信息*/
exports.requestvoteFeedback = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var sign = {
        agent : api.agent,
        type : 2,
        bizid : reqBody.bizid,
        secret : api.secret
    };
    var signs = dictAndMd5ize(sign);
    var body = {
        agent : api.agent,
        type : 2,
        bizid : [reqBody.bizid],
        secret : api.secret,
        sign : signs
    }
    var data = JSON.stringify(body);
    postData.send(data, voteFeedback, function (result) {
        res.send(result);
    });
}
/*保存投票的反馈信息*/
exports.voteFeedbackData = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var totalCount = nodata(reqBody.totalCount);
    var yesCount = nodata(reqBody.yesCount);
    var noCount = nodata(reqBody.noCount);
    var ignoreCount = nodata(reqBody.ignoreCount);
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'UPDATE dj.voteInfo SET yesCount = ' + yesCount + ',noCount = ' + noCount + ',ignoreCount = ' + ignoreCount + ',totalCount = ' + totalCount + ' WHERE actualEndTime is null';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*保存话题*/
exports.requestsaveTopic = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var data = {
        text : reqBody.text, //得到话题内容
        subject : reqBody.subject, //得到话题主题
        startTime : reqBody.startTime, //得到话题开始时间
        endTime : reqBody.endTime, //得到话题结束时间
        bizid : reqBody.bizid, //得到bizid
        time : getTimeNow(), //插入该条记录的时间
        cityid : cityCode,
        topicid : getRandomString('topicInfo', 'topicid') //生成十五位的随机码
    };
    var conf = extend(dj, {
        'database' : 'dj'
    })
    var query = new db.orm(conf);
    query.init();
    var sql = 'INSERT INTO dj.topicInfo (text,time,bizid,startTime,endTime,subject,topicid,cityCode) VALUES ("' + data.text + '","' + data.time + '","' + data.bizid + '","' + data.startTime + '","' + data.endTime + '","' + data.subject + '","' + data.topicid + '","' + data.cityid + '")';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    });
    query.end();
}
/*TSP请求话题内容*/
exports.requesttopicToTsp = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var agent = reqBody.agent;
    var client = redis.createClient(config.redis["port"], config.redis["host"]);
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    client.get(agent + ':secret', function (err, reply) {
        var secret = reply;
        var data = {
            serviceType : reqBody.serviceType,
            agent : agent,
            secret : secret
        }
        var signs = dictAndMd5ize(data);
        if (reqBody.sign == signs) {
            var conf = extend(dj, {
                'database' : 'dj'
            });
            var query = new db.orm(conf);
            query.init();
            var sql = 'SELECT text,subject,topicid FROM dj.topicInfo where actualEndTime is null ORDER BY time DESC LIMIT 1';
            query.exec(sql, function (rows, fields) {
                if (rows.length != 0) {
                    var djrows = {
                        "ERRORCODE" : "0",
                        "RESULT" : {
                            "city" : [{
                                "name" : cityName,
                                "radioStation" : [{
                                    "stationName" : radioStationName,
                                    "stationTopic" : rows
                                }]
                            }]
                        }
                    };
                } else {
                    var djrows = {
                        "ERRORCODE" : "0",
                        "RESULT" : {
                            "city" : []
                        }
                    };
                }
                client.quit();
                query.end();
                res.json(djrows);
            });

        } else {
            var djrows = {
                "ERRORCODE" : "ME11001",
                "RESULT" : null
            };
            client.quit();
            res.json(djrows);
        }
    });
}

/*话题反馈结果*/
exports.requesttopicFeedback = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var topicID = reqBody.topicID;
    var bizid = reqBody.bizid;
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT count(*)  AS counts FROM dj.topicDiscussInfo WHERE topicID="' + topicID + '"';
    query.exec(sql, function (rows, fields) {
        var sign = {
            agent : api.agent,
            type : 2,
            bizid : bizid,
            secret : api.secret
        };
        var signs = dictAndMd5ize(sign);
        var body = {
            agent : api.agent,
            type : 2,
            bizid : [bizid],
            secret : api.secret,
            sign : signs
        }
        var data = JSON.stringify(body);
        postData.send(data, topicFeedback, function (result) {
            var result = {result:result,rows:rows};
            res.send(result);
        });
    })
    query.end();
}
/*显示历史话题详情*/
exports.showTopicHistory = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var id = reqBody.id;
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.topicInfo WHERE id=' + id;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*载入已选播互动路况*/
exports.selectedTraffic = function (req, res, next) {
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.sharedWeibo WHERE broadcast = 1 AND cityName LIKE "'+cityName+'"';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*得到已选播和已关闭互动路况的ID*/
exports.getUnID = function (req, res, next) {
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT id FROM dj.sharedWeibo WHERE broadcast != 0 AND cityName LIKE "'+cityName+'"';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*存入已选播的路况到库*/
exports.saveAnycastTraffic = function(req,res,next){
    var reqBody = handleParam(req.body); //得到POST的数据
    var conf = extend(dj, {'database' : 'dj'});
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT id FROM dj.sharedWeibo WHERE id = '+reqBody.id+' AND cityName LIKE "'+cityName+'"';
    query.exec(sql, function (rows, fields) {
        if (rows == "") {
            var sql = 'INSERT INTO dj.sharedWeibo (id,text,time,agent,serviceType,sign,broadcast,longitude,latitude,supportOnline,cityCode,cityName,jamLocation,direction,jamReason,jamState) VALUES ("'+reqBody.id+'","' + reqBody.text + '","' + getTimeNow() + '","' + reqBody.agent + '","' + reqBody.serviceType + '","' + reqBody.sign + '","' + 1 + '","' + reqBody.longitude + '","' + reqBody.latitude + '",' +0+ ',"'+cityCode+'","'+cityName+'","'+reqBody.jamLocation+'","'+reqBody.direction+'","'+reqBody.jamReason+'","'+reqBody.jamState+'")';
            query.exec(sql, function (rows, fields) {
                res.json(rows);
            });
            query.end();
        }else{
            var rows = {fieldCount:'ME01003'};
            res.json(rows);
            query.end();

        }
    });
}
/*更改选播【用户留言】的状态*/
exports.requestanycast = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var id = reqBody.id; //得到选播的id
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'UPDATE dj.topicDiscussInfo SET broadcast = 1 WHERE id= ' + id;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*得到已选播的【选播路况信息】/【话题留言】*/
exports.showAnycast = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var id = reqBody.id; //得到选播路况的id
    var table = reqBody.table; //得到选播的表名
    table = table == 1 ? ('sharedWeibo') : ('topicDiscussInfo');
    var conf = extend(dj, {
        'database' : 'dj'
    })
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.' + table + ' WHERE broadcast = 1  AND id= ' + id + ' ORDER BY time limit 1';
    query.exec(sql, function (rows, fields) {
        res.send(rows);
    })
    query.end();
}
/*更改关闭的选播【路况信息】/【留言】的状态*/
exports.requestClose = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var id = reqBody.id; //得到选播的id
    var table = reqBody.table; //得到选播的表名
    table = table == 1 ? ('sharedWeibo') : ('topicDiscussInfo');
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'UPDATE dj.' + table + ' SET broadcast = 2 WHERE id= ' + id;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*更改全部关闭的选播【路况信息】/【留言】的状态*/
exports.requestCloseAll = function (req, res, next) {
    var reqBody = handleParam(req.body); //得到POST的数据
    var table = reqBody.table; //得到选播的表名
    table = table == 1 ? ('sharedWeibo') : ('topicDiscussInfo');
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'UPDATE dj.' + table + ' SET broadcast = 2 WHERE broadcast = 1';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}

/*互动活动 TSP传入用户回复话题的内容*/
exports.replyTopic = function (req, res, next) {
    var reqBody = handleParam(req.body);
    var agent = reqBody.agent;
    var client = redis.createClient(config.redis["port"], config.redis["host"]);
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    client.get(agent + ':secret', function (err, reply) {
        var secret = reply;
        var sign = reqBody.sign;
        var time = getTimeNow();
        var data = {
            agent : agent,
            secret : secret,
            text : reqBody.text,
            topicid : reqBody.topicid,
            broadcast : reqBody.broadcast,
            serviceType : reqBody.serviceType,
            mirrtalkNumber : reqBody.mirrtalkNumber,
            supportOnline : reqBody.supportOnline
        };
        var signs = dictAndMd5ize(data);
        if (sign == signs) {
            var conf = extend(dj, {
                'database' : 'dj'
            });
            var query = new db.orm(conf);
            query.init();
            var sql = 'SELECT id FROM dj.topicInfo WHERE actualEndTime is  null AND  topicID = "' + reqBody.topicid + '"';
            query.exec(sql, function (rows, fields) {
                if (rows != "") {
                    var sql = 'INSERT INTO dj.topicDiscussInfo (text,topicid,mirrtalkNumber,time,broadcast,supportOnline) VALUES ("' + data.text + '","' + data.topicid + '","' + data.mirrtalkNumber + '","' + time + '","' + 0 + '","' + data.supportOnline + '")';
                    query.exec(sql, function (rows, fields) {
                        client.quit();
                        if (rows.fieldCount == 0) {
                            var djrows = {
                                "ERRORCODE" : "0",
                                "RESULT" : null
                            }
                            global.socketDJ['key'].emit('replyTopic',{replyTopic:'0'});
                        } else {
                            var djrows = {
                                "ERRORCODE" : "ME01003",
                                "RESULT" : null
                            };
                        }
                        res.json(djrows);
                    });
                    query.end();
                } else {
                    var djrows = {
                        "ERRORCODE" : "ME01003",
                        "RESULT" : null
                    };
                    res.json(djrows);
                    query.end();
                }
            });
        } else {
            var djrows = {
                "ERRORCODE" : "ME11001",
                "RESULT" : null
            };
            client.quit();
            res.json(djrows);
        }
    });
}
/*互动活动 从TSP得到用户回复话题的内容*/
exports.showReplyTopic = function (req, res, next) {
    var reqBody = handleParam(req.body);
    var topicID = reqBody.topicID;
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.topicDiscussInfo WHERE broadcast = 0 AND topicID = "' + topicID + '" ORDER BY time DESC LIMIT 30';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动话题 得到实时有效的互动话题*/
exports.requestshowTopic = function (req, res, next) {
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.topicInfo WHERE actualEndTime is null ORDER BY time desc limit 1';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动话题 得到有效的互动话题 每十秒*/
exports.refreshReplyTopic = function (req, res, next) {
    var reqBody = handleParam(req.body);
    var topicID = reqBody.topicID;
    var id = reqBody.id;
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.topicDiscussInfo  WHERE broadcast= 0  AND topicID ="' + topicID + '" AND id>' + id + ' ORDER BY time';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动话题 载入实时有效的已选播互动话题*/
exports.selectedReplyTopic = function (req, res, next) {
    var reqBody = handleParam(req.body);
    var topicID = reqBody.topicID;
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM dj.topicDiscussInfo WHERE broadcast= 1  AND topicID ="' + topicID + '" ORDER BY time';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动话题 保存用户反馈数据*/
exports.topicFeedbackData = function (req, res, next) {
    var reqBody = handleParam(req.body);
    var topicID = nodata(reqBody.topicID);
    var totalCount = nodata(reqBody.totalCount);
    var joinInCount = nodata(reqBody.joinInCount);
    var conf = extend(dj, {
        'database' : 'dj'
    });
    var query = new db.orm(conf);
    query.init();
    var sql = 'UPDATE  dj.topicInfo SET totalCount = ' + totalCount + ' ,joinInCount = ' + joinInCount + ' WHERE topicID = "' + topicID + '"';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*DJ 发送路况快分享保存道客宝图*/
exports.radioTraffic = function (req,res,next) {
    var reqBody = handleParam(req.body);
    var suggestion = reqBody.suggestion;
    var sign = {
        agent : api.agent,
        serviceType : api.serviceType,
        secret : api.secret
    };
    var signs = dictAndMd5ize(sign);
    var body = {
        agent : api.agent,
        serviceType : api.serviceType,
        sign : signs.toUpperCase(),
        trafficInfo : [{
            cityName : encodeURI(cityName),         //初始化的城市名称
            startTime : encodeURI(getTimeNow()),                //影响时间
            trafficRoad: encodeURI(reqBody.trafficRoad),   //路况所在道路
            latitude: encodeURI(reqBody.lat),              //纬度
            longitude: encodeURI(reqBody.lng),             //经度
            text : encodeURI(reqBody.text),                 //路况内容
            direction : encodeURI(reqBody.direction),     //路况影响方向
            reason : encodeURI(reqBody.reason),            //路况产生原因
            state : encodeURI(reqBody.state),               //路况交通状况
            provider : encodeURI(radioStationName),       //路宽信息提供者
            nearRoad : encodeURI(reqBody.nearRoad),        //路况靠近的道路
            type : 0                            //路况信息
        }]
    };
    var data = JSON.stringify(body);
    postData.send(data, inserttrafficStatus, function (result) {
        console.log(result);
        if(result.ERRORCODE == 0){
            var conf = extend(dj, {'database' : 'dj'});
             var query = new db.orm(conf);
             query.init();
             var sql = 'INSERT INTO dj.sharedWeibo (text,time,agent,serviceType,sign,broadcast,longitude,latitude,supportOnline,cityCode,cityName,jamLocation,direction,jamReason,jamState,suggestion) VALUES ("' + sign.text + '","' + getTimeNow() + '","' + sign.agent + '","' + sign.serviceType + '","' + signs + '","' + 0 + '","' + sign.longitude + '","' + sign.latitude + '",' +0+ ',"'+cityCode+'","'+sign.cityName+'","'+sign.trafficRoad+'","'+sign.direction+'","'+sign.reason+'","'+sign.state+'","'+suggestion+'")';
             query.exec(sql, function (rows, fields) {
                 if (rows.fieldCount == 0) {
                     var djrows = {
                         "ERRORCODE" : "0",
                         "RESULT" : null
                     }
                     global.socketDJ['key'].emit('getTraffic',{getTraffic:'0'});
                 } else {
                     var djrows = {
                         "ERRORCODE" : "ME01003",
                         "RESULT" : null
                     };
                 }
                 query.end();
                 res.send(djrows);
             });
        }else{
            res.send(result);
        }
    });
}
/*获取互动路况*/
exports.getTrafficStatus = function(req,res,next){
    var reqBody = handleParam(req.body);
    var sign = {
        agent : api.agent,
        cityName : reqBody.cityName,
        //interval : getHour()*60,
        interval : 10,
        secret : api.secret,
        serviceType : api.serviceType
    };
    var signs = dictAndMd5ize(sign);
    var body = {
        agent : api.agent,
        cityName : encodeURI(reqBody.cityName),
        //interval : getHour()*60,
        interval : 10,
        sign : signs,
        serviceType : api.serviceType
    };
    var data = JSON.stringify(body);
    postData.send(data, gettrafficStatus, function (result) {
        res.send(result);
    });
}
/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-16
 * Time: 下午7:13
 * To change this template use File | Settings | File Templates.
 */
/*逻辑层*/
var db       = require('../modules/db'),
    config   = require('../config').config,
    postData = require('../lib/postData'),
    crypto   = require('crypto'),
    sha1 = require('sha1');
/*读取缓存*/
var redis = require("redis");
var check = require('validator').check,
    sanitize = require('validator').sanitize;
/*配置文件*/
var api         =   config.apiService//api入口
var mainApi     =   api.main;//api
var vote        =   config.vote;//投票入口
var voteFeedback    =   config.voteFeedback;//投票反馈入口
var trafficStatus    =   config.trafficStatus;//路况快分享
var dj  =   config.queryBase; //dj库入口
var topicToTsp  =   config.topicToTsp;  //发给tsp话题

/*处理空值与注入*/
function handleParam(params){
    var params = params || {};
    var safeParam = {};
    for(var key in params){
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
function getRandomString(table,column) {
    var len = 15;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789';
    var maxPos = $chars.length;
    var id = '';
    for (i = 0; i < len; i++) {
        id += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    var conf        =   extend(dj,{'database':'dj'});
    var query       =   new db.orm(conf);
    query.init();
    var sql = 'SELECT '+column+' FROM `dj`.`'+table+'` where '+column+'="'+id+'" limit 1';
    query.exec(sql,function (rows,fields) {
        if(rows != ""){
            id = getRandomString(table,column);
        }
    });
    query.end();
    return id;
}
//得到现在的时间
function getTimeNow(){
    var now = new Date();
    var theYear = now.getFullYear();
    var theMonth = now.getMonth() + 1;
    var theDay = now.getDate();
    var theHour = now.getHours();
    var theMinutes = now.getMinutes();
    var theSeconds = now.getSeconds();
    return  timer = theYear+'-'+add0(theMonth)+'-'+add0(theDay)+' '+add0(theHour)+':'+add0(theMinutes)+':'+add0(theSeconds);
    function add0(num){
        if(num<10){
            return	"0"+num;
        }else{
            return num;
        }
    }
}
//字典排序再散列器
function dictAndMd5ize(obj,secret){
    var array = new Array();

    //字典排序

    for(var key in obj)
    {
        array.push(key);
    }
    array.sort();

    var paramArray = new Array();

    //拼接字符串

    for(var index in array)
    {
        var key = array[index];
        paramArray.push(key + obj[key]);
    }

    //md5化
    var md5Source = paramArray.join("");
    var sign = sha1(md5Source).toUpperCase();

    return sign;
}
/*返回值判断*/
function returnValue(res,code){
    console.log(code);
    switch(code.ERRORCODE){
        case '0' :
            res.json({'ME':'亲，活动发布成功！','class':'text-success','bizid':code.RESULT["bizid"]});
            break;
        default :
            res.json({'ME':'亲，活动发布失败！','class':'text-error','bizid':''});
    }
}
/*浅拷贝,处理各种配置*/
var extend = function(result, source) {
    for (var key in source)
        result[key] = source[key];
    return result;
}
/*显示主页*/
exports.index = function (req, res) {
    res.render('index',[]);
};
exports.notFound = function (req, res, next) {
    res.render('404.html');
};
/*发送投票/话题*/
exports.requestDistrictWeibo = function (req,res,next){
    var reqBody =  handleParam(req.body); //得到POST的数据
    var content = reqBody.content;  //投票内容
    var timer   = reqBody.timers;   //时间
    var sign = {
        agent:api.agent,
        allowYes:1,
        cityCode:api.cityCode,
        interval:timer,
        regionWeiboType:3,
        text:content,
        secret:api.secret,
        serviceType:api.serviceType
    };
    var signs = dictAndMd5ize(sign);
    var body = {
        agent:api.agent,
        allowYes:1,
        cityCode:api.cityCode,
        interval:timer,
        regionWeiboType:3,
        text:encodeURI(content),
        serviceType:api.serviceType,
        sign:signs
    };
    var data = JSON.stringify(body);
    postData.send(data, vote, function (result) {
        var code =  JSON.parse(result);
        returnValue(res,code);
    });
}
/*保存投票*/
exports.requestsaveVote = function (req,res,next){
    var reqBody     =   handleParam(req.body); //得到POST的数据
    var data = {
        content     :   reqBody.content,
        time        :   getTimeNow(),
        bizid       :   reqBody.bizid,
        startTime   :   reqBody.startTime,
        endTime     :   reqBody.endTime,
        yesInfo     :   reqBody.yesInfo,
        noInfo      :   reqBody.noInfo,
        ignoreInfo  :   reqBody.ignoreInfo,
        voteId      :   getRandomString('voteInfo','voteid'),    //生成十五位的随机码
        cityid      :   '101040100'
    }
    var conf        =   extend(dj,{'database':'dj'});
    var query       =   new db.orm(conf);
    query.init();
    var sql = 'INSERT INTO `dj`.`voteInfo` (text,time,bizid,startTime,endTime,yesInfo,noInfo,ignoreInfo,voteid,cityAbbreviation) VALUES ("'+data.content+'","'+data.time+'","'+data.bizid+'","'+data.startTime+'","'+data.endTime+'","'+data.yesInfo+'","'+data.noInfo+'","'+data.ignoreInfo+'","'+data.voteId+'","'+data.cityid+'")';
    query.exec(sql,function (rows,fields) {
        res.json(rows);
    });
    query.end();
}
/*得到历史投票/话题并分页*/
exports.requestHistory = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var page    =   reqBody.page;
    var table = reqBody.table;
    table  = table==1?('voteInfo'):('topicInfo');
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`'+table+'` ORDER BY time DESC LIMIT '+page+',7';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*更新 投票/话题 的实际结束时间*/
exports.updateTime = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var actualEndTime = reqBody.actualEndTime;
    var table = reqBody.table;
    table  = table==1?('voteInfo'):('topicInfo');
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'UPDATE `dj`.`'+table+'` SET actualEndTime = "'+actualEndTime+'" WHERE actualEndTime=""' ;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*显示历史投票详情*/
exports.showVoteHistory = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var id    =   reqBody.id;
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`voteInfo` WHERE id='+id;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*投票反馈信息*/
exports.requestvoteFeedback = function(req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var sign    = {
        agent:api.agent,
        type:2,
        bizid:reqBody.bizid,
        secret:api.secret
    };
    var signs   = dictAndMd5ize(sign);
    var body    = {
        agent:api.agent,
        type:2,
        bizid:[reqBody.bizid],
        secret:api.secret,
        sign:signs
    }
    var data = JSON.stringify(body);
    postData.send(data, voteFeedback, function (result) {
        res.json(result);
    });
}
/*保存投票的反馈信息*/
exports.voteFeedbackData = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var totalCount      =   reqBody.totalCount;
    var yesCount      =   reqBody.yesCount;
    var noCount      =   reqBody.noCount;
    var ignoreCount      =   reqBody.ignoreCount;
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'UPDATE `dj`.`voteInfo` SET yesCount = '+yesCount+',noCount = '+noCount+',ignoreCount = '+ignoreCount+',totalCount = '+totalCount+' WHERE actualEndTime = ""';
    console.log(sql);
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*保存话题*/
exports.requestsaveTopic = function (req,res,next){
    var reqBody     =   handleParam(req.body); //得到POST的数据
    var data        =   {
         text        :   reqBody.text,    //得到话题内容
         subject     :   reqBody.subject,    //得到话题主题
         startTime   :   reqBody.startTime,    //得到话题开始时间
         endTime     :   reqBody.endTime,    //得到话题结束时间
         bizid       :   reqBody.bizid,    //得到bizid
         time        :   getTimeNow(),       //插入该条记录的时间
         cityid      :   topicToTsp.cityCode,
         topicid     :   getRandomString('topicInfo','topicid')    //生成十五位的随机码
    };
    var conf        =   extend(dj,{'database':'dj'})
    var query       =   new db.orm(conf);
    query.init();
    var sql = 'INSERT INTO `dj`.`topicInfo`(text,time,bizid,startTime,endTime,subject,topicid,cityAbbreviation) VALUES ("'+data.text+'","'+data.time+'","'+data.bizid+'","'+data.startTime+'","'+data.endTime+'","'+data.subject+'","'+data.topicid+'","'+data.cityid+'")';
    query.exec(sql,function (rows,fields) {
        res.json(rows);
    });
    query.end();
}
/*TSP请求话题内容*/
exports.requesttopicToTsp = function (req,res,next){
    var reqBody     =   handleParam(req.body);     //得到POST的数据
    var agent       =   reqBody.agent;
    var client = redis.createClient(config.redis["port"],config.redis["host"]);
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    client.get(agent+':secret',function (err,reply){
        var secret  =   reply;
        var data    =   {
            serviceType  :    reqBody.serviceType,
            agent        :    agent,
            secret       :    secret
        }
        var signs   =   dictAndMd5ize(data);
        if(reqBody.sign == signs){
            var conf    =   extend(dj,{'database':'dj'});
            var query   =   new db.orm(conf);
            query.init();
            var sql = 'SELECT text,subject,topicid FROM `dj`.`topicInfo` where actualEndTime = "" ORDER BY time DESC LIMIT 1';
            query.exec(sql, function (rows, fields) {
                if(rows.length != 0){
                    var djrows = {"ERRORCODE":"0","RESULT":{"city":[{"name":"重庆市","radioStation":[{"stationName":"重庆955交通广播","stationTopic":rows}]}]}};
                }else{
                    var djrows = {"ERRORCODE":"0","RESULT":{"city":[]}};
                }
                client.quit();
                query.end();
                res.json(djrows);
            });

        }else{
            var djrows = {"ERRORCODE":"ME11001","RESULT":null};
            client.quit();
            res.json(djrows);
        }
    });
}
/*显示历史话题详情*/
exports.showTopicHistory = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var id    =   reqBody.id;
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`topicInfo` WHERE id='+id;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动路况*/
exports.requesttrafficweibo = function (req,res,next){
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`sharedWeibo` WHERE broadcast = 0  ORDER BY time desc limit 30';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*载入已选播互动路况*/
exports.selectedTraffic = function (req,res,next){
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`sharedWeibo` WHERE broadcast = 1';
	console.log(sql);
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*刷新互动路况*/
exports.refreshTrafficweibo = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var id      =   reqBody.id;    //得到最后一条路况的id
    var conf    =   extend(dj,{'database':'dj'})
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`sharedWeibo` WHERE broadcast = 0 AND id >'+id+' ORDER BY time ';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*更改选播【路况信息】/【用户留言】的状态*/
exports.requestanycast = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var id      =   reqBody.id;    //得到选播的id
    var table   =   reqBody.table;    //得到选播的表名
    table = table == 1?('sharedWeibo'):('topicDiscussInfo');
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'UPDATE `dj`.`'+table+'` SET broadcast = 1 WHERE id= '+id;
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*得到已选播的【选播路况信息】/【话题留言】*/
exports.showAnycast = function (req,res,next){
    var reqBody     =   handleParam(req.body); //得到POST的数据
    var id          =   reqBody.id;    //得到选播路况的id
    var table   =   reqBody.table;    //得到选播的表名
    table = table == 1?('sharedWeibo'):('topicDiscussInfo');
    var conf        =   extend(dj,{'database':'dj'})
    var query       =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`'+table+'` WHERE broadcast = 1  AND id= '+id+' ORDER BY time limit 1';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*更改关闭的选播【路况信息】/【留言】的状态*/
exports.requestClose = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var id      =   reqBody.id;    //得到选播的id
    var table   =   reqBody.table;    //得到选播的表名
    table = table == 1?('sharedWeibo'):('topicDiscussInfo');
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'UPDATE `dj`.`'+table+'` SET broadcast = 2 WHERE id= '+id;
    console.log(sql);
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*更改全部关闭的选播【路况信息】/【留言】的状态*/
exports.requestCloseAll = function (req,res,next){
    var reqBody =   handleParam(req.body); //得到POST的数据
    var table   =   reqBody.table;    //得到选播的表名
    table = table == 1?('sharedWeibo'):('topicDiscussInfo');
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'UPDATE `dj`.`'+table+'` SET broadcast = 2 WHERE broadcast = 1';
    console.log(sql);
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*TSP保存互动路况*/
exports.saveTrafficStatus = function (req,res,next){
    var reqBody     =   handleParam(req.body); //得到POST的数据
    var agent       =   reqBody.agent;
    var client = redis.createClient(config.redis["port"],config.redis["host"]);
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    client.get(agent+':secret',function (err,reply){
        var secret  =   reply;
        var time        =   getTimeNow();
        var sign        =   reqBody.sign;
        var data = {
            secret      :   secret,
            broadcast   :   trafficStatus.broadcast,
            agent        :  agent,
            serviceType :   trafficStatus.serviceType,
            text        :   reqBody.text,
            bizid       :   reqBody.bizid,
            mirrtalkNumber  :   reqBody.mirrtalkNumber,
            name        :   reqBody.name,
            nickname    :   reqBody.nickname,
            longitude    :   reqBody.longitude,
            latitude    :   reqBody.latitude,
            supportOnline:   reqBody.supportOnline
        }
        var signs =     dictAndMd5ize(data);
        if(signs==sign){
            var conf    =   extend(dj,{'database':'dj'});
            var query   =   new db.orm(conf);
            query.init();
            var sql = 'INSERT INTO `dj`.`sharedWeibo` (text,time,bizid,agent,serviceType,sign,mirrtalkNumber,name,nickname,broadcast,longitude,latitude,supportOnline) VALUES ("'+data.text+'","'+time+'","'+data.bizid+'","'+data.agent+'","'+data.serviceType+'","'+signs+'","'+data.mirrtalkNumber+'","'+data.name+'","'+data.nickname+'","'+data.broadcast+'","'+data.longitude+'","'+data.latitude+'","'+data.supportOnline+'")';
            query.exec(sql, function (rows, fields) {
                if(rows.fieldCount ==0){
                    var djrows = {"ERRORCODE":"0","RESULT":null}
                }else{
                    var djrows = {"ERRORCODE":"ME01003","RESULT":null};
                }
                client.quit();
                res.json(djrows);
            })
            query.end();
        }else{
            var djrows = {"ERRORCODE":"ME11001","RESULT":null};
            client.quit();
            res.json(djrows);
        }
    });
}
/*互动活动 TSP传入用户回复话题的内容*/
exports.replyTopic = function (req,res,next){
    var reqBody     =   handleParam(req.body);
    var agent       =   reqBody.agent;
    var client = redis.createClient(config.redis["port"],config.redis["host"]);
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    client.get(agent+':secret',function (err,reply){
        var secret  =   reply;
        var sign    =   reqBody.sign;
        var time    =   getTimeNow();
        var data    =   {
            agent   :   agent,
            secret  :   secret,
            text    :   reqBody.text,
            topicid :   reqBody.topicid,
            broadcast :   reqBody.broadcast,
            serviceType :   reqBody.serviceType,
            mirrtalkNumber  :   reqBody.mirrtalkNumber,
            supportOnline  :   reqBody.supportOnline
        };
        var signs = dictAndMd5ize(data);
        if(sign == signs){
            var conf    =   extend(dj,{'database':'dj'});
            var query   =   new db.orm(conf);
            query.init();
            var sql = 'INSERT INTO `dj`.`topicDiscussInfo` (text,topicid,mirrtalkNumber,time,broadcast,supportOnline) VALUES ("'+data.text+'","'+data.topicid+'","'+data.mirrtalkNumber+'","'+time+'","'+0+'","'+data.supportOnline+'")';
            query.exec(sql, function (rows, fields) {
                client.quit();
                if(rows.fieldCount ==0){
                    var djrows = {"ERRORCODE":"0","RESULT":null}
                }else{
                    var djrows = {"ERRORCODE":"ME01003","RESULT":null};
                }
                res.json(djrows);
            })
            query.end();
        }else{
            var djrows = {"ERRORCODE":"ME11001","RESULT":null};
            client.quit();
            res.json(djrows);
        }
    });
}
/*互动活动 从TSP得到用户回复话题的内容*/
exports.showReplyTopic = function (req,res,next){
    var reqBody     =   handleParam(req.body);
    var topicID       =   reqBody.topicID;
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`topicDiscussInfo` WHERE broadcast = 0 AND topicID = "'+topicID+'" ORDER BY time DESC LIMIT 30';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动话题 得到实时有效的互动话题*/
exports.requestshowTopic = function (req,res,text){
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`topicInfo` WHERE actualEndTime = "" ORDER BY time desc limit 1';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动话题 得到有效的互动话题 每十秒*/
exports.refreshReplyTopic = function (req,res,text){
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`topicDiscussInfo`  WHERE broadcast= 0  AND topicID ="'+topicID+'" ORDER BY time';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}
/*互动话题 载入实时有效的已选播互动话题*/
exports.selectedReplyTopic = function (req,res,text){
    var reqBody     =   handleParam(req.body);
    var topicID       =   reqBody.topicID;
    var conf    =   extend(dj,{'database':'dj'});
    var query   =   new db.orm(conf);
    query.init();
    var sql = 'SELECT * FROM `dj`.`topicDiscussInfo` WHERE broadcast= 1  AND topicID ="'+topicID+'" ORDER BY time';
    query.exec(sql, function (rows, fields) {
        res.json(rows);
    })
    query.end();
}


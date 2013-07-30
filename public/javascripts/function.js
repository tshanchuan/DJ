/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-7-9
 * Time: 下午6:00
 * To change this template use File | Settings | File Templates.
 */
/*清空页面多余元素*/
function emptyHtml(){
    $('.EffectPreview').empty();
    $('.ToComplete').empty();
    $('.FillInForm').empty();
}
/*验证非法字符*/
function checkstr(str){
    var res = str.replace(/<([^ >])+[^>]*>(?:[\S\s]*?<\/\1>)?/g,"");
    return res.split(" ");
}
/*去除相同的ID*/
function delRepeat(arr) {
    if (({}).toString.call(arr) !== '[object Array]')
        return;
    var i,
        key,
        l = arr.length,
        tp = {},
        result = [];
    for (i = 0; i < l; i += 1) {
        key = arr[i];
        !tp[key] && (result.push(key),tp[key] = true);
    }
    return result;
}
/*删除除了指定ID的值*/
function removeID(idArray,id){
    for(var i=0;i< idArray.length;i++){
        if(idArray[i] != id){
            idArray.splice(i,1);
            return idArray;
        }
    }
    return idArray;
}
/*提示内容*/
function prompt(data){
    $('.alert span').text(data.str);
    $('.alert').removeClass(data.uncss).addClass(data.css).css("display","block").animate({"top": "-5%"}, "slow").fadeOut(5000);
}
//得到时间
function getTime(timer) {
    var now = new Date();
    now.setSeconds(now.getMinutes()+timer*60);
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
/*两个时间差*/
function timeLag(str,end){
    str = new Date(Date.parse(str.replace(/\-/g,"/")));
    end = new Date(Date.parse(end.replace(/\-/g,"/")));
    return ((end-str)/60000);
}

function timeLagToday(str){
    var startTime = str.slice(5,10);
    var endTime = getTime(0).slice(5,10);

    if(startTime == endTime){
        return 0;
    }else{
        return 1;
    }
}

function getCookieVal(offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if (endstr == -1) {
        endstr = document.cookie.length;
    }
    return unescape(document.cookie.substring(offset, endstr));
}

// primary function to retrieve cookie by name
function getCookie(name) {
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    while (i < clen) {
        var j = i + alen;
        if (document.cookie.substring(i, j) == arg) {
            return getCookieVal(j);
        }
        i = document.cookie.indexOf(" ", i) + 1;
        if (i == 0) break;
    }
    return;
}
// store cookie value with optional details as needed
function setCookie(name, value, expires, path, domain, secure) {
    var hours =  getTime(0).slice(11,-6);
    var exp = new Date();
    exp.setTime(exp.getTime() + hours*60*60*1000);
    document.cookie = name + "=" + escape(value)+
        ";expires=" + exp.toGMTString() +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        ((secure) ? "; secure" : "");
}

// remove the cookie by setting ancient expiration date
function deleteCookie(name, path, domain) {
    if (getCookie(name)) {
        document.cookie = name + "=" +
            ((path) ? "; path=" + path : "") +
            ((domain) ? "; domain=" + domain : "") +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}


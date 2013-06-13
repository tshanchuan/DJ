/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-18
 * Time: 上午11:58
 * To change this template use File | Settings | File Templates.
 */
/*页面载入时载入地图和互动路况*/
var $id = function (id) {
    return document.getElementById(id);
}
var topicClock,topicAccount,topicArray,voteClock,voteAccount,voteArray =[],bizids,topicID,setReplyTopic,setVoteFeedback,setTopicFeedback;

/*页面关闭*/
/*window.onbeforeunload = onbeforeunload_handler;
window.onunload = onunload_handler;
function onbeforeunload_handler(){
    var warning="确认退出?";
    return warning;
}

function onunload_handler(){
    var warning="谢谢光临";
    alert(warning);
}*/
/*清空页面多余元素*/
function emptyHtml(){
    $('.EffectPreview').empty();
    $('.ToComplete').empty();
    $('.FillInForm').empty();
}
/*验证非法字符*/
function checking(str){
   var res = str.replace(/<([^ >])+[^>]*>(?:[\S\s]*?<\/\1>)?/gi,"");
   return res;
}
/*提示内容*/
function prompt(data){
    $('.alert span').text(data.str);
    $('.alert').removeClass(data.uncss).addClass(data.css).css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000);
}
/*把倒计时参数存入cookie*/
// utility function to retrieve an expiration data in proper format;
function getExpDate(days, hours, minutes) {
    var expDate = new Date();
    if (typeof(days) == "number" && typeof(hours) == "number" && typeof(hours) == "number") {
        expDate.setDate(expDate.getDate() + parseInt(days));
        expDate.setHours(expDate.getHours() + parseInt(hours));
        expDate.setMinutes(expDate.getMinutes() + parseInt(minutes));
        return expDate.toGMTString();
    }
}
//utility function called by getCookie()
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
    document.cookie = name + "=" + escape(value) +
        ((expires) ? "; expires=" + expires : "") +
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
$(function(){
    mapInit();        //载入地图
    Trafficweibo();   //载入互动路况
    addTileLayer_TRAFFIC(); //载入地图的红绿黄条
    interactTopic() ;    //载入实时互动话题
	selectedTraffic(); //载入已选播未关闭的路况
    voteClock = getCookie('voteClock');
    topicClock = getCookie('topicClock');
    voteClock > 0?(voteRemainTime()):('');
    topicClock > 0?(topicRemainTime()):('');
    $('#close').click(function (){
        $('.alert').css("display","none");
    })
});
/*实时交通层 手动刷新*/
$(function(){
    var reload = $('#reload');
    reload.click(function(){
        removeTileLayer_TRAFFIC();
        addTileLayer_TRAFFIC(); //调用map.js 添加实时交通层
    });
    var AR = $('#AutoRefresh'),rate;
    rate = setInterval("removeTileLayer_TRAFFIC(),addTileLayer_TRAFFIC()",900000);
    AR.change(function (){
        var timer = AR.val();
        var judge = $('#isAutoRefresh').val();
        if(judge == 0){
            switch (timer){
                case '15':
                    clearInterval(rate);
                    rate = setInterval("removeTileLayer_TRAFFIC(),addTileLayer_TRAFFIC()",900000);
                    break;
                case '20':
                    clearInterval(rate);
                    rate = setInterval("removeTileLayer_TRAFFIC(),addTileLayer_TRAFFIC()",1200000);
                    break;
                case '30':
                    clearInterval(rate);
                    rate = setInterval("removeTileLayer_TRAFFIC(),addTileLayer_TRAFFIC()",1800000);
                    break;
            }
        }else{
            clearInterval(rate);
        }
    });
});
/*投票*/
function vote(){
    voteHistory();//显示历史投票的内容
    emptyHtml();//显示历史投票的内容
    $('.appArea ul li:first-child').addClass("active");
    $('.appArea ul li:nth-child(2)').removeClass("active");
    var VoteHtml = '<ul class="nav nav-list">' +
        '<li>' +
            '<a class="btn" href="javascript:initiateVote();">发起一个投票活动</a>' +
        '</li>' +
            '<ul class="nav nav-list" id="VoteHistory"></ul>' +
        '</ul>';
    $('#New').html(VoteHtml);
    $('#voteNews').fadeOut(500);
}

function initiateVote(){
    if(voteClock > 0){ //是否还有没结束的投票
        var promptContent ={
            str : "投票正在进行，请稍等。",
            uncss:"alert-error",
            css:"alert-success"
        }
        prompt(promptContent);
    }else{
        emptyHtml();
        var newVoteForm =
            '<ul class="nav">' +
                '<li class="form-inline">' +
                    '<label for="VoteContent">投票主题：</label>' +
                    '<textarea id="VoteContent" rows="3" cols="10" placeholder="简洁明了..."></textarea>' +
                    '<span class="text-error VoteContent_error hide">请输入投票内容！</span>' +
                '</li>' +
                '<li class="form-inline">' +
                    '<label id="Voteoption">投票选项：</label><span class="text-error Voteoption_error">请至少输入一个投票选项！</span>'+
                    '<ul class="nav">' +
                        '<li class="form-inline">' +
                            '<i class="icon-thumbs-up"></i>' +
                            '<label for="YesContent">按圆圈键：</label><input type="text" id="YesContent">' +
                        '</li>'+
                        '<li class="form-inline">' +
                            '<i class="icon-thumbs-down"></i>' +
                            '<label for="NoContent">按叉叉键：</label><input type="text" id="NoContent">' +
                        '</li>' +
                        '<li class="form-inline">' +
                            '<i class="icon-hand-down"></i>' +
                            '<label for="UnContent">没有应答：</label><input type="text" id="UnContent">' +
                        '</li>'+
                    '</ul>' +
                '</li>' +
                '<li class="form-inline">' +
                    '<label for="VoteAging">投票时效：</lable>'+
                        '<select id="VoteAging">' +
                            '<option value="10">10分钟</option>'+
                            '<option value="20">20分钟</option>'+
                            '<option value="30">30分钟</option>'+
                            '<option value="60">60分钟</option>'+
                            '<option value="120">120分钟</option>'+
                        '</select>' +
                '</li>' +
                '<li class="form-inline">' +
                    '<label for="voteLottery">设置抽奖：</label>' +
                    '<button class="btn btn-link">+新增抽奖活动</button>' +
                    '<button class="btn pull-right" onclick="votePreview();">预览</button>' +
                '</li>' +
            '</ul>' +
            '';
        $('.FillInForm').html(newVoteForm);
    }
}
/*预览投票内容*/
function votePreview(){
    var content = checking($('#VoteContent').val());  //投票内容
    var yes     = checking($('#YesContent').val());   //圆圈键
    var no      = checking($('#NoContent').val());    //叉叉键
    var ignore  = checking($('#UnContent').val());    //无响应
    var timers  = $('#VoteAging').val();    //时效
    if(content ==="" || content ==undefined ){
        $('.VoteContent_error').css('display','inline').fadeOut(7500);
    }else if(yes === "" && no === "" && ignore === "" ){
        $('.Voteoption_error').css('display','inline').fadeIn(7500);
    }else if(yes == undefined && no == undefined && ignore == undefined ){
        $('.Voteoption_error').css('display','inline').fadeIn(7500);
    }else {
        voteArray = {
            text    :   content,
            yesInfo :   yes,
            noInfo   :  no,
            ignoreInfo: ignore,
            timers  :   timers,
            totalCount    :   0,
            yesCount    :   0,
            noCount     :   0,
            ignoreCount :   0
        };
        var votePreviewHtml = '<h4>语镜用户将听到：</h4>' +
            '<h3 id="vote">'+content+'。<br />'+yes+'请按圆圈键，'+no+'请按叉键，'+ignore+'不需要回复。</h3>'+
                '<button class="btn pull-right" id="votePostBtn" onclick="votePost(voteArray);">确认发布</button>';
        $('.EffectPreview').html(votePreviewHtml);
    }
}
/*提交投票*/
function votePost(voteArray){
    var votecontent = $('#vote').text();
    $.ajax({
        url:'/DistrictWeibo',
        type:'POST',
        data:{content:votecontent,timers:voteArray.timers},
        dataType:'json'
    }).done(function (data){
        $('.ToComplete').html('<h3 class='+data.class+'>'+data.ME+'</h3><button class="btn btn-primary pull-right" id="ViewVote" onclick="ViewVote(voteArray);">查看活动</button>');
        $id('votePostBtn').disabled = true;
        $('#votePostBtn').addClass('disabled');
        bizids = data.bizid;
        if(bizids !=""){
            var st = getTime(0);
            var et = getTime(voteArray.timers);
            $.ajax({
                url:'/saveVote',
                type:'POST',
                data:{content:voteArray.text,bizid:bizids,startTime:st,endTime:et,yesInfo:voteArray.yesInfo,noInfo:voteArray.noInfo,ignoreInfo:voteArray.ignoreInfo},
                dataType:'json'
            }).done(function (data){
                  data.fieldCount == 0?(
                    VoteCountDown(voteArray.timers),
                    voteHistory(),//调用数据库得到刚发送的投票
                    voteFeedback(bizids), //得到投票的用户反馈
                    $('#VoteHistory li:first-child').css("background-color","rgba(11, 223, 28, 0.41)")
                  ):($('.ToComplete').append('<h6>投票内容保存失败</h6>'));
            });
        }else{
            $id('ViewVote').disabled = true;
            $('#ViewVote').addClass('disabled');
            $id('votePostBtn').disabled = false;
            $('#votePostBtn').removeClass('disabled');
        }
    });
}
/*查看投票结果*/
function ViewVote(voteArray){
    var voteSituationHtml='';
    if(voteArray.timers !="" || voteArray.actualEndTime==""){
        voteSituationHtml  =
            '<div class="voteSituation">' +
                '<h4>本次投票成功推送至<strong class="text-error" id="total">'+voteArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>距离结束还有<em id="voteClock" class="label label-info">0时0分0秒</em></h3>' +
                '<button class="btn btn-danger" id="stopVote" onclick="earlyTerminationVote();">提前结束</button>' +
                '<button class="btn btn-success">系统抽奖</button>'+
            '</div>';
    }else{
        voteSituationHtml  =
            '<div class="voteSituation">' +
                '<h4>本次投票成功推送至<strong class="text-error">'+voteArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>已结束</h3>' +
                '<button class="btn btn-success">系统抽奖</button>'+
            '</div>';
    }
    var votePreviewHtml    =
        '<div class="votePreview">' +
            '<h3>投票内容：</h3>' +
            '<h4>'+voteArray.text+'。<br />'+voteArray.yesInfo+'请按圆圈键，'+voteArray.noInfo+'请按叉键，'+voteArray.ignoreInfo+'不需要回复。</h4>' +
            '<button class="btn pull-right" onclick="originalVoteForm(voteArray);">原始表单</button>' +
        '</div>';
    var voteFeedbackHtml   =
        '<div class="voteFeedback">' +
            '<h3>参与投票人数 <em id="allNum">'+voteArray.totalCount+'</em> 人</h3>' +
            '<h4>'+voteArray.yesInfo+'（YES键）<em id="yesNum">'+voteArray.yesCount+'</em> 票</h4>' +
            '<h4>'+voteArray.noInfo+'（NO键）<em id="noNum">'+voteArray.noCount+'</em> 票</h4>' +
            '<h4>'+voteArray.ignoreInfo+'（无回复）<em id="ignoreNum">'+voteArray.ignoreCount+'</em> 票</h4>' +
            '<h3>获奖人数<em id="winNum">0</em> 人</h3>'+
            '<button class="btn btn-primary pull-right">导出详情</button>' +
        '</div>'
    $('.FillInForm').html(votePreviewHtml);
    $('.EffectPreview').html(voteSituationHtml);
    $('.ToComplete').html(voteFeedbackHtml);
}
function originalVoteForm (voteArray){
    var actualEndTime =  voteArray.actualEndTime == undefined?('无法统计'):(voteArray.actualEndTime);
    var timers = voteArray.timers ==""?(timeLag(voteArray.startTime,voteArray.endTime)):(voteArray.timers);
    var originalVoteForm =
        '<ul class="nav">' +
            '<li class="form-inline">' +
            '<label for="">投票主题：</label>' +
            '<span>'+voteArray.text+'</span>   ' +
            '</li>' +
            '<li class="form-inline">' +
            '<label>投票选项：</label>'+
            '<ul class="nav">' +
            '<li class="form-inline">' +
            '<i class="icon-thumbs-up"></i>' +
            '<label>按圆圈键：</label><span>'+voteArray.yesInfo+'</span>' +
            '</li>'+
            '<li class="form-inline">' +
            '<i class="icon-thumbs-down"></i>' +
            '<label>按叉叉键：</label><span>'+voteArray.noInfo+'</span>' +
            '</li>' +
            '<li class="form-inline">' +
            '<i class="icon-hand-down"></i>' +
            '<label>没有应答：</label><span>'+voteArray.ignoreInfo+'</span>' +
            '</li>'+
            '</ul>' +
            '</li>' +
            '<li class="form-inline">' +
                '<label>投票时效：</lable><span>'+timers+'分钟</span>'+
            '</li>' +
            '<li class="form-inline">' +
                '<label>实际结束时间：</label><span>'+actualEndTime+'</span>' +
            '</li>' +
            '</ul>' +
            '';
    $('.FillInForm').html(originalVoteForm);
}
/*投票互动倒计时*/
function VoteCountDown(timers){
    switch (timers){
        case '10':
            voteClock = '600';
            voteRemainTime();
            break;
        case '20':
            voteClock = '1200';
            voteRemainTime();
            break;
        case '30':
            voteClock = '1800';
            voteRemainTime();
            break;
        case '60':
            voteClock = '3600';
            voteRemainTime();
            break;
        default :
            voteClock = '7200';
            voteRemainTime();
    }
}
/*提前结束投票*/
function earlyTerminationVote(){
    var  actualEndTime = getTime(0);
    $.ajax({
        type:'POST',
        url:'/updateTime',
        data:{actualEndTime:actualEndTime,table:'1'},
        dataType:'json'
    }).done(function(data){
        data.fieldCount == 0?(
            voteFeedbackData(), //保存反馈数据
            $id('stopVote').disabled= true,
            $('#stopVote').addClass('disabled'),
            voteClock = 0,
            setCookie('voteClock',voteClock),
            clearTimeout(voteAccount),
            clearTimeout(setVoteFeedback),
            $('.alert span').text("投票结束啦，赶快去看看吧！"),
            $('.alert').removeClass("alert-error").addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
            $('#VoteHistory li:first-child').css("background-color","white")
        ):(
            $('.alert span').text("投票结束失败！"),
            $('.alert').removeClass("alert-success").addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
        );
    });
}
/*保存投票反馈信息*/
function voteFeedbackData (){
    var totalCount = $('#total').text();
    var yesCount = $('#yesNum').text();
    var noCount = $('#noNum').text();
    var ignoreCount = $('#ignoreNum').text();
    $.ajax({
        type:'POST',
        data:{totalCount:totalCount,yesCount:yesCount,noCount:noCount,ignoreCount:ignoreCount},
        url:'/voteFeedbackData',
        dataType:'json'
    }).done(function (data){
        console.log(data);
    });
}
/*搜索语镜用户的反馈结果*/
function voteFeedback(bizids){
    $.ajax({
        type:'POST',
        url:'/voteFeedback',
        data:{bizid:'bizids'},
        dataType:'json'
    }).done(function(data){
       if(data.ERRORCODE == 0 ){
           var allNum = data.RESULT[0]["total"];
           var yesNum = data.RESULT[0]["yes_count"];
           var noNum = data.RESULT[0]["no_count"];
           var ignoreNum = (allNum-yesNum-noNum);
           $('#total').text(allNum);
           $('#allNum').text(allNum);
           $('#yesNum').text(yesNum);
           $('#noNum').text(noNum);
           $('#ignoreNum').text(ignoreNum);
       }
    });
}
//setVoteFeedback =setInterval(voteFeedback,10000);
/*得到历史投票内容并分页*/
function voteHistory(){
    var voteHistoryHtml='';
    $.ajax({
        type:'POST',
        url:'/History',
        data:{page:0,table:'1'},
        dataType:'json'
    }).done(function(data){
        if (data.length != 0){
            votePages(data[0]["id"]);
            for(var i=0;i<data.length;i++){
                voteHistoryHtml +=
                    '<li><a href="javascript:showVoteHistory('+data[i]["id"]+');" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'">'+data[i]["text"]+'</a></li>';
            }
            $("#VoteHistory").html(voteHistoryHtml);
            $('a[data-toggle|="tooltip"]').tooltip('hide');
        }
    });
}
/*分页*/
function votePages(data){
    var votePageHtml ='';
    var options = {
        currentPage: 1,
        totalPages: Math.ceil(data/7),
        size:'small',
        alignment:'center',
        onPageChanged: function(e,originalEvent,page){
            $.ajax({
                type:'POST',
                url:'/History',
                data:{page:(page-1)*7,table:'1'},
                dataType:'json'
            }).done(function(data){
                votePageHtml ='';
                for(var i=0;i<data.length;i++){
                    votePageHtml +=
                        '<li><a href="javascript:showVoteHistory('+data[i]["id"]+');" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'">'+data[i]["text"]+'</a></li>';
                }
                $("#VoteHistory").html(votePageHtml);
                $('a[data-toggle|="tooltip"]').tooltip('hide');
            });
        }
    }
    $('#Page').bootstrapPaginator(options);
}
/*展示历史投票*/
function showVoteHistory(data){
    $.ajax({
        type:'POST',
        url:'/showVoteHistory',
        data:{id:data},
        dataType:'json'
    }).done(function(data){
        voteArray = {
            text        :   data[0]["text"],
            yesInfo     :   data[0]["yesInfo"],
            noInfo      :   data[0]["noInfo"],
            ignoreInfo  :   data[0]["ignoreInfo"],
            totalCount    :   data[0]["totalCount"],
            yesCount    :   data[0]["yesCount"],
            noCount     :   data[0]["noCount"],
            ignoreCount :   data[0]["ignoreCount"],
            actualEndTime   :   data[0]["actualEndTime"],
            startTime   :   data[0]["startTime"],
            endTime   :   data[0]["endTime"],
            timers:''
        }
        ViewVote(voteArray);
    });
}
//倒计时函数
function voteRemainTime(){
    var iDay,iHour,iMinute,iSecond;
    var sDay="",sHour="",sMinute="",sSecond="",sTime="";
    setCookie('voteClock',voteClock);
    if (voteClock >= 0){
        iDay = parseInt(voteClock/24/3600);
        if (iDay > 0){
            sDay = iDay + "天";
        }
        iHour = parseInt((voteClock/3600)%24);
        if (iHour > 0){
            sHour = iHour + "小时";
        }
        iMinute = parseInt((voteClock/60)%60);
        if (iMinute > 0){
            sMinute = iMinute + "分钟";
        }
        iSecond = parseInt(voteClock%60);
        if (iSecond >= 0){
            sSecond = iSecond + "秒";
        }
        if ((sDay=="")&&(sHour=="")){
            sTime = sMinute+sSecond;
        }else{
            sTime=sDay+sHour+sMinute+sSecond;
        }
        if(voteClock==0){
            clearTimeout(voteAccount);
            earlyTerminationVote();
            sTime="0时0分0秒";
        }else{
            voteAccount = setTimeout("voteRemainTime()",1000);
        }
        voteClock=voteClock-1;
    }else{
        sTime="倒计时结束！";
    }
    $('#voteClock').text(sTime);
}
/*话题*/
function topic(){
    topicHistory(); //得到历史的话题内容
    emptyHtml();
    $('.appArea ul li:first-child').removeClass("active");
    $('.appArea ul li:nth-child(2)').addClass("active");
    var topicHtml = '<ul class="nav nav-list">' +
        '<li>' +
        '<a class="btn" href="javascript:initiateTopic();">发起一个话题活动</a>' +
        '</li>' +
        '<ul class="nav nav-list" id="TopicHistory"></ul>' +
        '</ul>';
    $('#New').html(topicHtml);
    $('#topicNews').fadeOut(500);
}
/*新建话题*/
function initiateTopic(){
    if(topicClock > 0 ){
        var promptContent ={
            str : "话题正在进行，请稍等。",
            uncss:"alert-error",
            css:"alert-success"
        }
        prompt(promptContent);
    }else{
        emptyHtml();
    var newTopicForm  = '<ul class="nav">' +
        '<li class="form-inline">' +
            '<label for="topicTitle">话题主题：</label>' +
            '<input type="text" placeholder="输入文本" id="topicTitle" >' +
            '<span class="text-error hide topicTitle_error">请输入话题主题！</span>' +
        '</li>' +
        '<li class="form-inline">' +
            '<label for="topicContent">话题内容：</label>' +
            '<textarea rows="5" cols="10" placeholder="简洁明了" id="topicContent"></textarea>' +
            '<span class="text-error hide topicContent_error">请输入话题内容！</span>' +
        '</li>' +
        '<li class="form-inline">' +
            '<label for="topicTimers">活动时效：</label>' +
            '<select id="topicTimers">' +
                '<option value="10">10分钟</option>' +
                '<option value="20">20分钟</option>' +
                '<option value="30">30分钟</option>' +
                '<option value="60">60分钟</option>' +
                '<option value="120">120分钟</option>' +
            '</select>' +
        '</li>' +
        '<li class="form-inline">' +
            '<lable for="topicLottery">设置抽奖：</lable>' +
            '<button class="btn btn-link">+新增抽奖活动</button>' +
            '<button class="btn pull-right" onclick="topicPreview()">预览</button>' +
        '</li>' +
        '</ul>';
    $('.FillInForm').html(newTopicForm);
    }
}
/*预览话题*/

function topicPreview(){
    var topicTitle      =   checking($('#topicTitle').val());     //话题主题
    var topicContent    =   checking($('#topicContent').val());  //话题内容
    var topicTimers     =   checking($('#topicTimers').val());  //话题时效
    if(topicTitle ==="" || topicTitle == undefined){
        $('.topicTitle_error').css('display','inline').fadeOut(7500);
    }else if(topicContent === "" || topicContent == undefined){
        $('.topicContent_error').css('display','inline').fadeOut(7500);
    }else{
        topicArray = {
            topicTitle      :   topicTitle,
            topicContent    :   topicContent,
            timers           :   topicTimers,
            totalCount      :   0,
            joinInCount     :   0
        }
        var topicHtml = '<h4>语镜用户将听到：</h4>' +
            '<h3 id="topic">'+topicTitle+'<br />' +topicContent+'</h3>' +
            '<button id="topicPostBtn" class="btn pull-right" onclick="topicPost(topicArray)">确认发布</button>';
        $('.EffectPreview').html(topicHtml);
    }
}
function topicPost(topicArray){
    var topic = $('#topic').text();
    $.ajax({
        type:'POST',
        data:{content:topic,timers:topicArray.timers},
        url:'/DistrictWeibo',    //和投票是一个接口 复用了
        dataType:'json'
    }).done(function(data){
            $('.ToComplete').html('<h3 class='+data.class+'>'+data.ME+'</h3><button class="btn btn-primary pull-right" id="ViewTpoic" onclick="ViewTopic(topicArray);">查看活动</button>');
            $id('topicPostBtn').disabled = true;
            $('#topicPostBtn').addClass('disabled');
            bizids = data.bizid;
            if(bizids !=""){
                var st = getTime(0);
                var et = getTime(topicArray.timers);
                $.ajax({
                    type:'POST',
                    data:{text:topicArray.topicContent,subject:topicArray.topicTitle,startTime:st,endTime:et,bizid:bizids},
                    url:'/saveTopic',
                    dataType:'json'
                }).done(function(data){
                    data.fieldCount == 0?(
                        topicFeedback(bizids),
                        TopicCountDown(topicArray.timers),
                        interactTopic(),
                        topicHistory(), //得到历史的话题内容
                        $('#TopicHistory li:first-child').css("background-color","rgba(11, 223, 28, 0.41)")
                        ):($('.ToComplete').append('<h6>话题内容保存失败</h6>'));
                });
            }else{
                $id('ViewTpoic').disabled = true;
                $('#ViewTpoic').addClass('disabled');
                $id('topicPostBtn').disabled = false;
                $('#topicPostBtn').removeClass('disabled');
            }
    });
}
/*查看话题结果*/
function ViewTopic(topicArray){
    var topicSituationHtml='';
    if(topicArray.timers !="" ||topicArray.actualEndTime==""){
        topicSituationHtml  =
            '<div class="voteSituation">' +
                '<h4>本次话题成功推送至<strong id="topicNum" class="text-error">'+topicArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>距离结束还有<em id="topicClock" class="label label-info">0时0分0秒</em></h3>' +
                '<button class="btn btn-danger" id="stopTopic" onclick="earlyTerminationTopic();">提前结束</button>' +
                '<button class="btn btn-success">系统抽奖</button>'+
            '</div>';
    }else{
        topicSituationHtml  =
            '<div class="voteSituation">' +
                '<h4>本次话题成功推送至<strong id="topicAllNum" class="text-error">'+topicArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>已结束</h3>' +
                '<button class="btn btn-success">系统抽奖</button>'+
            '</div>';
    }
    var topicPreviewHtml    =
        '<div class="votePreview">' +
            '<h3>'+topicArray.topicTitle+'</h3>' +
            '<h4>'+topicArray.topicContent+'</h4>' +
            '<button class="btn pull-right" onclick="originalTopicForm(topicArray);">原始表单</button>' +
            '</div>';
    var topicFeedbackHtml   =
        '<div class="voteFeedback">' +
            '<h3>参与人数<em id="topicJoinNum">'+topicArray.totalCount+'</em> 人</h3>' +
            '<h3>发言数量<em id="speakTopic">'+topicArray.joinInCount+'</em> 条</h3>' +
            '<h3>获奖人数<em id="">0</em> 人</h3>'+
            '<button class="btn btn-primary pull-right">导出详情</button>' +
            '</div>'
    $('.FillInForm').html(topicPreviewHtml);
    $('.EffectPreview').html(topicSituationHtml);
    $('.ToComplete').html(topicFeedbackHtml);
}
/*得到话题的反馈结果*/
function topicFeedback(bizids){
    $.ajax({
        type:'POST',
        url:'/topicFeedback',
        data:{bizid:'bizids'},
        dataType:'json'
    }).done(function(data){
        if(data.ERRORCODE == 0 ){
            var allNum = data.RESULT[0]["total"];
            $('#topicAllNum').text(allNum);
            $('#topicJoinNum').text(allNum);
        }
    });
}
//setTopicFeedback = setInterval(topicFeedback,10000);
/*显示原始话题结构*/
function originalTopicForm(topicArray){
    var actualEndTime =  topicArray.actualEndTime == undefined?('无法统计'):(topicArray.actualEndTime);
    var timers = topicArray.timers ==""?(timeLag(topicArray.startTime,topicArray.endTime)):(topicArray.timers);
    var originalTopicForm  = '<ul class="nav">' +
        '<li class="form-inline">' +
            '<label>话题主题：</label><span>'+topicArray.topicTitle+'</span>' +
        '</li>' +
        '<li class="form-inline">' +
            '<label>话题内容：</label><span>'+topicArray.topicContent+'</span>' +
        '</li>' +
        '<li class="form-inline">' +
            '<label>活动时效：</label><span>'+timers+'分钟</span>' +
        '</li>' +
        '<li class="form-inline">' +
            '<label>实际结束：</label><span>'+actualEndTime+'</span>' +
        '</li>' +
        '</ul>';
    $('.FillInForm').html(originalTopicForm);
}
/*得到历史话题内容并分页*/
function topicHistory(){
    var topicHistoryHtml='';
    $.ajax({
        type:'POST',
        url:'/History',
        data:{page:0,table:'2'},
        dataType:'json'
    }).done(function(data){
        if (data.length != 0){
            topicPages(data[0]["id"]);
            for(var i=0;i<data.length;i++){
                topicHistoryHtml +=
                    '<li><a href="javascript:showTopicHistory('+data[i]["id"]+');" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'">'+data[i]["subject"]+'</a></li>';
            }
            $("#TopicHistory").html(topicHistoryHtml);
            $('a[data-toggle|="tooltip"]').tooltip('hide');
        }
    });
}
/*分页*/
function topicPages(data){
    var topicPageHtml ='';
    var options = {
        currentPage: 1,
        totalPages: Math.ceil(data/7),
        size:'small',
        alignment:'center',
        onPageChanged: function(e,originalEvent,page){
            $.ajax({
                type:'POST',
                url:'/History',
                data:{page:(page-1)*7,table:'2'},
                dataType:'json'
            }).done(function(data){
                    topicPageHtml ='';
                    for(var i=0;i<data.length;i++){
                        topicPageHtml +=
                            '<li><a href="javascript:showTopicHistory('+data[i]["id"]+');" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'">'+data[i]["text"]+'</a></li>';
                    }
                    $("#TopicHistory").html(topicPageHtml);
                    $('a[data-toggle|="tooltip"]').tooltip('hide');
                });
        }
    }
    $('#Page').bootstrapPaginator(options);
}
/*展示历史话题*/
function showTopicHistory(data){
    $.ajax({
        type:'POST',
        url:'/showTopicHistory',
        data:{id:data},
        dataType:'json'
    }).done(function(data){
            topicArray = {
                topicTitle      :   data[0]["subject"],
                topicContent    :   data[0]["text"],
                totalCount      :   data[0]["totalCount"],
                joinInCount     :   data[0]["joinInCount"],
                actualEndTime   :   data[0]["actualEndTime"],
                startTime       :   data[0]["startTime"],
                endTime         :   data[0]["endTime"],
                timers:''
            }
            ViewTopic(topicArray);
        });
}
/*话题互动倒计时*/

function TopicCountDown(timers){
    switch (timers){
        case '10':
            topicClock = '600';
            topicRemainTime();
            break;
        case '20':
            topicClock = '1200';
            topicRemainTime();
            break;
        case '30':
            topicClock = '1800';
            topicRemainTime();
            break;
        case '60':
            topicClock = '3600';
            topicRemainTime();
            break;
        default :
            topicClock = '7200';
            topicRemainTime();
    }
}
/*提前结束话题*/
function earlyTerminationTopic(){
    var  actualEndTime = getTime(0);
    $.ajax({
        type:'POST',
        url:'/updateTime',
        data:{actualEndTime:actualEndTime,table:'2'},
        dataType:'json'
    }).done(function(data){
        data.fieldCount == 0?(
            $id('stopTopic').disabled= true,
            $('#stopTopic').addClass('disabled'),
            topicClock=0,
            setCookie('topicClock',topicClock),
            clearTimeout(topicAccount),
            clearInterval(setReplyTopic),
            clearInterval(setTopicFeedback),
            $('.IATitle h4').remove(),
            $('.alert span').text("话题结束啦，赶快去看看吧！"),
            $('.alert').removeClass("alert-error").addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
            $('#TopicHistory li:first-child').css("background-color","white")
        ):(
            $('.alert span').text("话题结束失败！"),
            $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
        );
    });
}
//倒计时函数
function topicRemainTime(){
    var iDay,iHour,iMinute,iSecond;
    var sDay="",sHour="",sMinute="",sSecond="",sTime="";
    setCookie('topicClock',topicClock);
    if (topicClock >= 0){
        iDay = parseInt(topicClock/24/3600);
        if (iDay > 0){
            sDay = iDay + "天";
        }
        iHour = parseInt((topicClock/3600)%24);
        if (iHour > 0){
            sHour = iHour + "小时";
        }
        iMinute = parseInt((topicClock/60)%60);
        if (iMinute > 0){
            sMinute = iMinute + "分钟";
        }
        iSecond = parseInt(topicClock%60);
        if (iSecond >= 0){
            sSecond = iSecond + "秒";
        }
        if ((sDay=="")&&(sHour=="")){
            sTime = sMinute+sSecond;
        }else{
            sTime=sDay+sHour+sMinute+sSecond;
        }
        if(topicClock==0){
            clearTimeout(topicAccount);
            earlyTerminationTopic();
            sTime="0时0分0秒";
        }else{
            topicAccount = setTimeout("topicRemainTime()",1000);
        }
        topicClock=topicClock-1;
    }else{
        sTime="倒计时结束！";
    }
    $('#topicClock').text(sTime);
}
/*得到互动路况*/
function Trafficweibo(){
    $.ajax({
        url:'/trafficStatus',
        type:'POST',
        dataType:'json'
    }).done(function(data){
        data.length == 0?(
            $('.alert span').text("没有新的路况信息，请稍等片刻！"),
            $('.alert').removeClass("alert-error").addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
        ):(showTraffic(data),refreshTraffic());
    });
}
function showTraffic(data){
    var trafficHtml = '<ul class="nav nav-list" id="traffic">';
    for(var i= data.length-1;i>=0;i--){
        if(data[i]["supportOnline"] ==1){
            trafficHtml +=
                '<li class="label" id=traffic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[i]["longitude"]+','+data[i]["latitude"]+');"class="btn btn-mini">定位</a>' +
                    '<a href="javascript:anycastTraffic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                    '</h5>' +
                '</li>';
        }else{
            trafficHtml +=
                '<li class="label" id=traffic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[i]["longitude"]+','+data[i]["latitude"]+');"class="btn btn-mini">定位</a>' +
                    '<a href="javascript:anycastTraffic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '</h5>' +
                '</li>';
        }
    }
    trafficHtml +='</ul>';
    var result = juicer(trafficHtml,data);
    $('#div1').append(result);
    $("a[data-toggle=popover]").popover('hide');
}
/*已选播未关闭的路况*/
function selectedTraffic(){
    $.ajax({
        type:'POST',
        url:'selectedTraffic',
        dataType:'json'
    }).done(function (data){
        for(var i=0;i<data.length;i++){
            if(data[i]["supportOnline"]==1){
                html = '<h5 id=removeTraffic'+data[i]["id"]+'>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[0]["longitude"]+','+data[i]["latitude"]+');" class="btn btn-mini">定位</a>' +
                    '<a href="javascript:RemoveTraffic('+data[i]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[0]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                    '</h5>';
            }else{
                html = '<h5 id=removeTraffic'+data[i]["id"]+'>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[i]["longitude"]+','+data[i]["latitude"]+');" class="btn btn-mini">定位</a>' +
                    '<a href="javascript:RemoveTraffic('+data[i]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                    '</h5>';
            }
            $('#div0').append(html);
            $("a[data-toggle=popover]").popover('hide');
        }
    });
}
    /*刷新路况*/
var leftStatus = 0;
function refreshTraffic(){
    $('#div1').mouseenter(function (){
        leftStatus = 1;
    }).mouseleave(function(){
        leftStatus = 0;
    });
    var last =$('#div1 ul li:last-child');
    var id = last.attr("name");
    if(id != undefined){
        $.ajax({
            type:'POST',
            url:'/refreshTraffic',
            data:{id:id},
            dataType:'json'
        }).done(function(data){
            data.length != 0?(
                newTraffic(data),
                leftStatus == 0?($("#div1").scrollTop(document.getElementById("traffic").scrollHeight)):('')
            ):('');
        });
        leftStatus == 0?($("#div1").scrollTop(document.getElementById("traffic").scrollHeight)):('');
    }else{
        Trafficweibo();
    }
}
setInterval(refreshTraffic,10000);
function newTraffic(data){
    var newtrafficHtml = '';
    for(var i=0;i<data.length;i++){
        if(data[i]["supportOnline"] ==1){
            newtrafficHtml +=
                '<li class="label" id=traffic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[i]["longitude"]+','+data[i]["latitude"]+');"class="btn btn-mini">定位</a>' +
                    '<a href="javascript:anycastTraffic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式"  >可联线</a>' +
                    '</h5>' +
                '</li>';
        }else{
            newtrafficHtml +=
                '<li class="label" id=traffic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[i]["longitude"]+','+data[i]["latitude"]+');"class="btn btn-mini">定位</a>' +
                    '<a href="javascript:anycastTraffic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '</h5>' +
                '</li>';
        }
    }
    var result = juicer(newtrafficHtml,data);
    $('#traffic').append(result);
    $("a[data-toggle=popover]").popover('hide');
}
/*选播路况信息*/
function anycastTraffic(id){
    $.ajax({
        url:'/Anycast',
        type:'POST',
        data:{id:id,table:1},
        dataType:'json'
    }).done(function(data){
        data.fieldCount == 0 ?(
            showanycastTraffic(id),
            $('#traffic'+id+'').remove()
        ):(
            $('.alert span').text("选播路况失败，稍后重试！"),
            $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
        );
    });
}
/*已选播区域*/
function showanycastTraffic(id){
    var html='';
    $.ajax({
        url:'/showAnycast',
        type:'POST',
        data:{id:id,table:1},
        dataType:'json'
    }).done(function(data){
        if(data[0]["supportOnline"]==1){
            html = '<h5 id=removeTraffic'+data[0]["id"]+'>' +
                '<span>'+data[0]["text"]+'</span>' +
                '<span>'+data[0]["time"]+'</span>' +
                '<a href="javascript:addTrafficOnMap('+data[0]["longitude"]+','+data[0]["latitude"]+');" class="btn btn-mini">定位</a>' +
                 '<a href="javascript:RemoveTraffic('+data[0]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[0]["nickname"]+',语镜号'+data[0]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
        '</h5>';
        }else{
            html = '<h5 id=removeTraffic'+data[0]["id"]+'>' +
                '<span>'+data[0]["text"]+'</span>' +
                '<span>'+data[0]["time"]+'</span>' +
                '<a href="javascript:addTrafficOnMap('+data[0]["longitude"]+','+data[0]["latitude"]+');" class="btn btn-mini">定位</a>' +
                 '<a href="javascript:RemoveTraffic('+data[0]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                 '</h5>';
        }
        $('#div0').append(html);
        $("a[data-toggle=popover]").popover('hide');
    });
}
/*移除已选播的路况*/
function RemoveTraffic(id){
    $.ajax({
        type:'POST',
        data:{id:id,table:1},
        url:'/Close',
        dataType:'json'
    }).done(function (data){
            data.fieldCount ==0?(
                $('.alert span').text("选播路况移除成功！"),
                $('.alert').addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
                 $('#removeTraffic'+id).remove()
            ):(
                $('.alert span').text("选播路况移除失败！"),
                $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
            );
    });
}
/*移除全部已选播路况*/
function removeTrafficAll(){
    $.ajax({
       type:'POST',
       data:{table:1},
       url:'/CloseAll',
       dataType:'json'
    }).done(function (data){
        data.fieldCount ==0?(
            $('.alert span').text("选播路况已全部移除！"),
            $('.alert').addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
            $('#div0 h5').remove()
        ):(
            $('.alert span').text("选播路况移除失败！"),
            $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
        );
    });
}
/*根据输入内容使路况信息里的关键字高亮*/
(function searchKeywords(){
    var keywords='';
    $('#keywords').blur(function (){
        keywords = $(this).val();
        $('#traffic').textSearch(keywords);
    });
})();
/*互动话题*/
function interactTopic(){
    $.ajax({
        type:'POST',
        url:'/showTopic',
        dataType:'json'
    }).done(function (data){
        if(data.length == 0){
            var promptContent ={
                str : "没有实时的互动话题！",
                uncss:"alert-error",
                css:"alert-success"
            }
            prompt(promptContent);
        }else{
            topicID = data[0]["topicID"];
            replyTopic(topicID); //载入留言
            selectedReplyTopic(topicID);   //载入已选播的留言
            topicArray = {
                topicTitle      :   data[0]["subject"],
                topicContent    :   data[0]["text"],
                totalCount      :   data[0]["totalCount"],
                joinInCount     :   data[0]["joinInCount"],
                actualEndTime   :   data[0]["actualEndTime"],
                startTime       :   data[0]["startTime"],
                endTime         :   data[0]["endTime"],
                timers:''
            }
            var html = '<h4 class="muted"><a href="javascript:;" onclick="ViewTopic(topicArray);">'+data[0]["subject"]+'</a></h4>';
            $('.IATitle').html(html);
        }
    });
}
/*互动话题留言*/
function replyTopic(topicID){
    $.ajax({
        type:'POST',
        url:'/showReplyTopic',
        data:{topicID:topicID},
        dataType:'json'
    }).done(function (data){
        if(data.length == 0){
            var promptContent ={
                str : "暂时没有用户留言！",
                uncss:"alert-error",
                css:"alert-success"
            }
            prompt(promptContent);
        }else{
            showReplyTopic(data);
            setReplyTopic= setInterval(refreshReplyTopic,10000);
            $('#speakTopic').text(data.length);
        }
    });
}
function showReplyTopic(data){
    var replyTopicHtml = '<ul class="nav nav-list" id="replyTopic">';
    for(var i= data.length-1;i>=0;i--){
        if(data[i]["supportOnline"] ==1){
            replyTopicHtml +=
                '<li class="label" id=replyTopic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:anycastTopic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                    '</h5>' +
                '</li>';
        }else{
            replyTopicHtml +=
                '<li class="label" id=replyTopic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:anycastTopic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '</h5>' +
                '</li>';
        }
    }
    replyTopicHtml +='</ul>';
    var result = juicer(replyTopicHtml,data);
    $('.showIA').append(result);
    $("a[data-toggle=popover]").popover('hide');
}
/*刷新留言*/
var rightStatus = 0;
function refreshReplyTopic(topicID){
    $('.showIA').mouseenter(function (){
        rightStatus = 1;
    }).mouseleave(function(){
       rightStatus = 0;
    });
    var last =$('.showIA ul li:last-child');
    var id = last.attr("name");
    if(id != undefined){
        $.ajax({
            type:'POST',
            url:'/refreshReplyTopic',
            data:{id:id,topicID:topicID},
            dataType:'json'
        }).done(function(data){
            data.length != 0?(
                newReplyTopic(data),
                rightStatus == 0?($(".showIA").scrollTop(document.getElementById("replyTopic").scrollHeight)):('')
            ):('');
        });
        rightStatus == 0?($(".showIA").scrollTop(document.getElementById("replyTopic").scrollHeight)):('');
    }else{
        replyTopic(topicID);
    }
}
function newReplyTopic(data){
    var newReplyTopicHtml = '';
    for(var i=0;i<data.length;i++){
        if(data[i]["supportOnline"] ==1){
            newReplyTopicHtml +=
                '<li class="label" id=traffic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:anycastTopic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式"  >可联线</a>' +
                    '</h5>' +
                    '</li>';
        }else{
            newReplyTopicHtml +=
                '<li class="label" id=traffic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:anycastTopic('+data[i]["id"]+');" class="btn btn-mini btn-primary">选播</a>' +
                    '</h5>' +
                    '</li>';
        }
    }
    var result = juicer(newReplyTopicHtml,data);
    $('#replyTopic').append(result);
    $("a[data-toggle=popover]").popover('hide');
}
/*选播这条话题的留言*/
function anycastTopic(id){
    $.ajax({
        url:'/Anycast',
        type:'POST',
        data:{id:id,table:2},
        dataType:'json'
    }).done(function(data){
        data.fieldCount == 0 ?(
            showanycastTopic(id),
            $('#replyTopic'+id+'').remove()
        ):(
            $('.alert span').text("选播留言失败，稍后重试！"),
            $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
        );
    });
}
function showanycastTopic(id){
    var html='';
    $.ajax({
        url:'/showAnycast',
        type:'POST',
        data:{id:id,table:2},
        dataType:'json'
    }).done(function(data){
            if(data[0]["supportOnline"]==1){
                html = '<h5 id=removeReplyTopic'+data[0]["id"]+'>' +
                    '<span>'+data[0]["text"]+'</span>' +
                    '<span>'+data[0]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[0]["longitude"]+','+data[0]["latitude"]+');" class="btn btn-mini">定位</a>' +
                    '<a href="javascript:RemoveReplyTopic('+data[0]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[0]["nickname"]+',语镜号'+data[0]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                    '</h5>';
            }else{
                html = '<h5 id=removeReplyTopic'+data[0]["id"]+'>' +
                    '<span>'+data[0]["text"]+'</span>' +
                    '<span>'+data[0]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[0]["longitude"]+','+data[0]["latitude"]+');" class="btn btn-mini">定位</a>' +
                    '<a href="javascript:RemoveReplyTopic('+data[0]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                    '</h5>';
            }
            $('.selectedIA').append(html);
            $("a[data-toggle=popover]").popover('hide');
    });
}
/*已选播未关闭的留言*/
function selectedReplyTopic(topicID){
    $.ajax({
        type:'POST',
        data:{topicID:topicID},
        url:'/selectedReplyTopic',
        dataType:'json'
    }).done(function (data){
        for(var i=0;i<data.length;i++){
            if(data[i]["supportOnline"]==1){
                html = '<h5 id=removeReplyTopic'+data[i]["id"]+'>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[i]["longitude"]+','+data[i]["latitude"]+');" class="btn btn-mini">定位</a>' +
                    '<a href="javascript:RemoveReplyTopic('+data[i]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                    '</h5>';
            }else{
                html = '<h5 id=removeReplyTopic'+data[i]["id"]+'>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:addTrafficOnMap('+data[i]["longitude"]+','+data[i]["latitude"]+');" class="btn btn-mini">定位</a>' +
                    '<a href="javascript:RemoveReplyTopic('+data[i]["id"]+');" class="btn btn-mini btn-primary">移除</a>' +
                    '</h5>';
            }
            $('.selectedIA').append(html);
            $("a[data-toggle=popover]").popover('hide');
        }
    });
}
/*移除选播的留言*/
function RemoveReplyTopic(id){
    $.ajax({
        type:'POST',
        data:{id:id,table:2},
        url:'/Close',
        dataType:'json'
    }).done(function (data){
            data.fieldCount ==0?(
                $('.alert span').text("选播留言移除成功！"),
                $('.alert').addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
                $('#removeReplyTopic'+id).remove()
            ):(
                $('.alert span').text("选播留言移除失败！"),
                $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
            );
        });
}
/*移除全部已选播的留言*/
function removeReplyTopicAll(){
    $.ajax({
        type:'POST',
        data:{table:2},
        url:'/CloseAll',
        dataType:'json'
    }).done(function (data){
        data.fieldCount ==0?(
            $('.alert span').text("选播留言移除成功！"),
            $('.alert').addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
            $('.selectedIA h5').remove()
            ):(
            $('.alert span').text("选播留言移除失败！"),
            $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
        );
    });
}



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
var topicClock,topicAccount,topicArray,voteClock,voteAccount,voteArray =[],newTopicArray=[],bizid,radioTrafficArray,topicID,setVoteFeedback,refshRoad;
$(function(){
    mapInit($('#DJ_x').text(),$('#DJ_y').text());        //载入地图
    setCookie('cityName',$('#DJ_cityName').text());
    setCookie('radioStationName',$('#DJ_radioStationName').text());
    $('.appArea').removeClass('hide');
    initDJ();
});
/*socket.io*/
var socket = io.connect('192.168.1.110');
/*建立socket链接*/
socket.on('DJ',function (data) {
    data.result == '0'?(socket.emit('my other event', { my: 'data' })):('');
});
/*载入留言*/
socket.on('replyTopic', function (data) {
    data.replyTopic == '0'?(refreshReplyTopic()):('');
});
/*载入路况*/
socket.on('getTraffic', function (data) {
    data.getTraffic == '0'?(getTrafficStatus()):('');
});
function initDJ(){
    unID();//载入已选播已关闭路况ID
    getTrafficStatus();   //载入互动路况
    addTileLayer_TRAFFIC();//载入地图的红绿黄条
    interactTopic();   //载入 实时互动话题
    selectedTraffic(); //载入已选播未关闭的路况
    refshRoad = setInterval("getTrafficStatus()",10000); //刷新路况
    voteClock = getCookie('voteClock');
    topicClock = getCookie('topicClock');
    voteClock > 0?(voteRemainTime()):('');
    topicClock > 0?(topicRemainTime()):('');
    $('#close').click(function (){
       $('.alert').css("display","none");
    });
    $('.Packup').click(function (){
        $('.PackupArea').fadeToggle("slow",function(){
            var style= $(this).attr('style');
            style =="display: none;"?(
                $('.Packup').text("显示应用区"),
                $('.IRC').css("height","910px"),
                $('#div1').height(910-$('#div0').height()-30),
                $('.TM').css("height","910px"),
                $('#iCenter').css("height","875px"),
                $('.TM form').css("top","-3.4%"),
                $('.IA').css("height","910px"),
                $('#home').css("height","819px"),
                $('#profile').css("height","910px"),
                $("#home").scrollTop(document.getElementById("DJtraffic").scrollHeight),
                $("#div1").scrollTop(document.getElementById("traffic").scrollHeight)
            ):(
                $('.Packup').text("隐藏应用区"),
                $('.IRC').css("height","600px"),
                $('#div1').height(570-$('#div0').height()),
                $('.TM').css("height","600px"),
                $('#iCenter').css("height","568px"),
                $('.TM form').css("top","-5.2%"),
                $('.IA').css("height","600px"),
                $('#home').css("height","508"),
                $('#profile').css("height","600px"),
                $("#home").scrollTop(document.getElementById("DJtraffic").scrollHeight),
                $("#div1").scrollTop(document.getElementById("traffic").scrollHeight)
            );
        });
    });
}
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
    $('.appArea ul li:nth-child(3)').removeClass("active");
    var VoteHtml = '<ul class="nav nav-list">' +
        '<li>' +
        '<a class="btn" href="javascript:;"onclick="initiateVote()">发起一个投票活动</a>' +
        '</li>' +
        '<ul class="nav nav-list" id="VoteHistory"></ul>' +
        '</ul>';

    $('#New').html(VoteHtml);
}

function initiateVote(){
    if(voteClock > 0){ //是否还有没结束的投票
        var promptContent ={
            str : "投票正在进行，请稍等。",
            uncss:"alert-error",
            css:"alert-success"
        }
        prompt(promptContent);
        $('#VoteHistory li:first-child').addClass('being');
    }else{
        emptyHtml();
        $('#VoteHistory li:first-child').removeClass('being');
        var newVoteForm =
            '<ul class="nav">' +
                '<li class="form-inline">' +
                '<label for="VoteContent">投票主题：</label>' +
                '<textarea id="VoteContent" rows="3" cols="10" placeholder="简洁明了..."></textarea>' +
                '<span class="text-error VoteContent_error hide"></span>' +
                '</li>' +
                '<li class="form-inline">' +
                '<label id="Voteoption">投票选项：</label><span class="text-error Voteoption_error"></span>'+
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
                '<button class="btn btn-link disabled" disabled>+新增抽奖活动</button>' +
                '<button class="btn " onclick="votePreview();" id="votePreview">预览</button>' +
                '</li>' +
            '</ul>';
        $('.FillInForm').html(newVoteForm);
    }
}
/*预览投票内容*/
function votePreview(){
    var content = checkstr($('#VoteContent').val());  //投票内容
    var yes     = checkstr($('#YesContent').val());   //圆圈键
    var no      = checkstr($('#NoContent').val());    //叉叉键
    var ignore  = checkstr($('#UnContent').val());    //无响应
    var timers  = $('#VoteAging').val();    //时效
    if(content =="" || content ==undefined ){
        $('.VoteContent_error').css('display','inline').text("请输入投票内容!").fadeOut(7500);
    }else if(yes == "" && no == "" && ignore == "" ){
        $('.Voteoption_error').css('display','inline').text('请至少输入一个投票选项！').fadeIn(7500);
    }else {
        voteArray = {
            text    :   content,
            yesInfo :   yes,
            noInfo   :  no,
            ignoreInfo: ignore,
            timers  :   timers,
            actualEndTime:null,
            totalCount    :   0,
            yesCount    :   0,
            noCount     :   0,
            ignoreCount :   0
        };
        var votePreviewHtml = '<h4>语镜用户将听到：</h4>' +
            '<h3 id="vote">'+content+'。<br />'+yes+'请按圆圈键，'+no+'请按叉键，'+ignore+'不需要回复。</h3>'+
            '<button class="btn " id="votePostBtn" onclick="votePost(voteArray);">确认发布</button>';
        $('.EffectPreview').html(votePreviewHtml);
    }
}
/*提交投票*/
function votePost(voteArray){
    var votecontent = $('#vote').text();
    $('.ToComplete').html('<h3 class="text-info">正在发送投票请等待......</h3>');
    $.ajax({
        url:'/DistrictWeibo',
        type:'POST',
        data:{content:votecontent,timers:voteArray.timers},
        dataType:'json'
    }).done(function (data){
            $('.ToComplete').html('<h3 class="'+data["class"]+'">'+data["ME"]+'</h3><button class="btn btn-primary" id="ViewVote" onclick="ViewVote(voteArray);">查看活动</button>');
            $id('votePostBtn').disabled = true;
            $('#votePostBtn').addClass('disabled');
            $id('votePreview').disabled = true;
            $('#votePreview').addClass('disabled');
            bizid = data.bizid;
            if(bizid !=""){
                setCookie('voteBizid',bizid);
                var st = getTime(0);
                var et = getTime(voteArray.timers);
                $.ajax({
                    url:'/saveVote',
                    type:'POST',
                    data:{content:voteArray.text,bizid:bizid,startTime:st,endTime:et,yesInfo:voteArray.yesInfo,noInfo:voteArray.noInfo,ignoreInfo:voteArray.ignoreInfo},
                    dataType:'json'
                }).done(function (data){
                        data.fieldCount == 0?(
                            voteHistory(),//调用数据库得到刚发送的投票
                            voteFeedback() ,//得到投票的用户反馈
                            setVoteFeedback =setInterval(voteFeedback,10000),
                            VoteCountDown(voteArray.timers)
                        ):($('.ToComplete').append('<h6>投票内容保存失败</h6>'));
                    });
            }else{
                $id('ViewVote').disabled = true;
                $('#ViewVote').addClass('disabled');
                $id('votePostBtn').disabled = false;
                $('#votePostBtn').removeClass('disabled');
                $id('votePreview').disabled = false;
                $('#votePreview').removeClass('disabled');
            }
        });
}
/*查看投票结果*/
function ViewVote(voteArray){
    var voteSituationHtml='',voteFeedbackHtml='';
    if(voteArray.timers !="" && voteArray.actualEndTime==null){
        voteSituationHtml  =
            '<div class="voteSituation">' +
                '<h4>本次投票成功推送至<strong class="text-error" id="total">'+voteArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>距离结束还有<span id="voteClock" class="label label-info">0时0分0秒</span></h3>' +
                '<button class="btn btn-danger" id="stopVote" onclick="earlyTerminationVote();">提前结束</button>' +
                '<button class="btn btn-success disabled" disabled>系统抽奖</button>'+
                '</div>';
        voteFeedbackHtml   =
            '<div class="voteFeedback">' +
                '<h3>参与人数 <span id="allNum">'+voteArray.totalCount+'</span>人</h3>' +
                '<h4>'+voteArray.yesInfo+'（YES键）<span id="yesNum">'+voteArray.yesCount+'</span> 票</h4>' +
                '<h4>'+voteArray.noInfo+'（NO键）<span id="noNum">'+voteArray.noCount+'</span>票</h4>' +
                '<h4>'+voteArray.ignoreInfo+'（无回复）<span id="ignoreNum">'+voteArray.ignoreCount+'</span>票</h4>' +
                '<h3>获奖人数<span id="winNum">0</span>人</h3>'+
                '<button class="btn btn-primary  disabled" disabled >导出详情</button>' +
                '</div>';
    }else if(voteArray.actualEndTime != ""){
        voteSituationHtml  =
            '<div class="voteSituation">' +
                '<h4>本次投票成功推送至<strong class="text-error">'+voteArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>已结束</h3>' +
                '<button class="btn btn-success disabled" disabled>系统抽奖</button>'+
                '</div>';
        voteFeedbackHtml   =
            '<div class="voteFeedback">' +
                '<h3>参与人数 <span>'+voteArray.totalCount+'</span>人</h3>' +
                '<h4>'+voteArray.yesInfo+'（YES键）<span>'+voteArray.yesCount+'</span>票</h4>' +
                '<h4>'+voteArray.noInfo+'（NO键）<span>'+voteArray.noCount+'</span>票</h4>' +
                '<h4>'+voteArray.ignoreInfo+'（无回复）<span>'+voteArray.ignoreCount+'</span>票</h4>' +
                '<h3>获奖人数<span>0</span>人</h3>'+
                '<button class="btn btn-primary  disabled" disabled >导出详情</button>' +
                '</div>';
    }
    var votePreviewHtml    =
        '<div class="votePreview">' +
            '<h3>投票内容：</h3>' +
            '<h4>'+voteArray.text+'。<br />'+voteArray.yesInfo+'请按圆圈键，'+voteArray.noInfo+'请按叉键，'+voteArray.ignoreInfo+'不需要回复。</h4>' +
            '<button class="btn " onclick="originalVoteForm(voteArray);">原始表单</button>' +
            '</div>';
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
                    $('#VoteHistory li:first-child').removeClass('being'),
                    voteClock = 0,
                    deleteCookie('voteClock'),
                    deleteCookie('voteBizid'),
                    clearTimeout(voteAccount),
                    clearInterval(setVoteFeedback),
                    $('.alert span').text("投票结束啦，赶快去看看吧！"),
                    $('.alert').removeClass("alert-error").addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
                    $id('stopVote').disabled= true,
                    $('#stopVote').addClass('disabled')
                ):(
                $('.alert span').text("投票结束失败！"),
                    $('.alert').removeClass("alert-success").addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
                );
        });
}
/*搜索语镜用户的反馈结果*/
function voteFeedback(){
    var bizid = getCookie('bizid');
    $.ajax({
        type:'POST',
        url:'/voteFeedback',
        data:{bizid:bizid},
        dataType:'json'
    }).done(function(data){
            //var data = JSON.parse(data);
            if(data.ERRORCODE == 0 ){
                var allNum = data.RESULT[0]["totalCount"];
                var yesNum = data.RESULT[0]["yesCount"];
                var noNum = data.RESULT[0]["noCount"];
                var ignoreNum = (allNum-yesNum-noNum);
                setCookie('allNum',allNum);
                setCookie('yesNum',yesNum);
                setCookie('noNum',noNum);
                setCookie('ignoreNum',ignoreNum);
                $('#total').text(allNum);
                $('#allNum').text(allNum);
                $('#yesNum').text(yesNum);
                $('#noNum').text(noNum);
                $('#ignoreNum').text(ignoreNum);
            }else{
                setCookie('allNum',0);
                setCookie('yesNum',0);
                setCookie('noNum',0);
                setCookie('ignoreNum',0);
            }
        });
}
/*保存投票反馈信息*/
function voteFeedbackData (){
    var totalCount = getCookie('allNum');
    var yesCount = getCookie('yesNum');
    var noCount = getCookie('noCount');
    var ignoreCount = getCookie('ignoreNum');
    $.ajax({
        type:'POST',
        data:{totalCount:totalCount,yesCount:yesCount,noCount:noCount,ignoreCount:ignoreCount},
        url:'/voteFeedbackData',
        dataType:'json'
    }).done(function (data){
           //console.log(data);
        });
   deleteCookie('allNum');
   deleteCookie('yesNum');
   deleteCookie('noNum');
   deleteCookie('ignoreNum');
}
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
                votePages(data[0]["num"]);
                for(var i=0;i<data.length;i++){
                    voteHistoryHtml +=
                        '<li><a href="javascript:;"onclick="showVoteHistory('+data[i]["id"]+')" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'">'+data[i]["text"]+'</a></li>';
                }
                $("#VoteHistory").html(voteHistoryHtml);
                $('a[data-toggle|="tooltip"]').tooltip('hide');
                $('#VoteHistory li:even').css('background-color','#AEBDCC');
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
                            '<li><a href="javascript:;" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'" onclick="showVoteHistory('+data[i]["id"]+')">'+data[i]["text"]+'</a></li>';
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
                timers		: timeLag(data[0]["startTime"],data[0]["endTime"])
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
    $('.appArea ul li:nth-child(3)').removeClass("active");
    var topicHtml = '<ul class="nav nav-list">' +
        '<li>' +
        '<a class="btn" href="javascript:;"onclick="initiateTopic()">发起一个话题活动</a>' +
        '</li>' +
        '<ul class="nav nav-list" id="TopicHistory"></ul>' +
        '</ul>';
    $('#New').html(topicHtml);
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
        $('#TopicHistory li:first-child').addClass('being');
    }else{
        emptyHtml();
        $('#TopicHistory li:first-child').removeClass('being');
        var newTopicForm  =
            '<ul class="nav">' +
                '<li class="form-inline">' +
                    '<label for="topicTitle">话题主题：</label>' +
                    '<input type="text" placeholder="输入文本" id="topicTitle" >' +
                    '<span class="text-error hide topicTitle_error"></span>' +
                '</li>' +
                '<li class="form-inline">' +
                    '<label for="topicContent">话题内容：</label>' +
                    '<textarea rows="5" cols="10" placeholder="简洁明了" id="topicContent"></textarea>' +
                   '<span class="text-error hide topicContent_error"></span>' +
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
                    '<button class="btn btn-link disabled" disabled>+新增抽奖活动</button>' +
                    '<button class="btn " onclick="topicPreview()" id="topicPreview">预览</button>' +
                '</li>' +
            '</ul>';
        $('.FillInForm').html(newTopicForm);
    }
}
/*预览话题*/
function topicPreview(){
    var topicTitle      =   checkstr($('#topicTitle').val());     //话题主题
    var topicContent    =   checkstr($('#topicContent').val());  //话题内容
    var topicTimers     =   $('#topicTimers').val();  //话题时效
    if(topicTitle ==""){
        $('.topicTitle_error').css('display','inline').text("请输入话题主题！").fadeOut(7500);
    }else if(topicContent == ""){
        $('.topicContent_error').css('display','inline').text("请输入话题内容！").fadeOut(7500);
    }else{
        topicArray = {
            topicTitle      :   topicTitle,
            topicContent    :   topicContent,
            timers           :   topicTimers,
            actualEndTime:null,
            totalCount      :   0,
            joinInCount     :   0
        }
        var topicHtml = '<h4>语镜用户将听到：</h4>' +
            '<h3 id="topic">'+topicTitle+'<br />' +topicContent+'</h3>' +
            '<button id="topicPostBtn" class="btn " onclick="topicPost(topicArray)">确认发布</button>';
        $('.EffectPreview').html(topicHtml);
    }
}
function topicPost(topicArray){
    var topic = $('#topic').text();
    $('.ToComplete').html('<h3 class="text-info">正在发送话题请等待......</h3>');
    $.ajax({
        type:'POST',
        data:{content:topic,timers:topicArray.timers},
        url:'/DistrictWeibo',    //和投票是一个接口 复用了
        dataType:'json'
    }).done(function(data){
            $('.ToComplete').html('<h3 class='+data["class"]+'>'+data["ME"]+'</h3><button class="btn btn-primary " id="ViewTpoic" onclick="ViewTopic(topicArray);">查看活动</button>');
            $id('topicPostBtn').disabled = true;
            $('#topicPostBtn').addClass('disabled');
            $id('topicPreview').disabled = true;
            $('#topicPreview').addClass('disabled');
            bizid = data.bizid;
            if(bizid !=""){
                setCookie('topicBizid',bizid);
                var st = getTime(0);
                var et = getTime(topicArray.timers);
                $.ajax({
                    type:'POST',
                    data:{text:topicArray.topicContent,subject:topicArray.topicTitle,startTime:st,endTime:et,bizid:bizid},
                    url:'/saveTopic',
                    dataType:'json'
                }).done(function(data){
                    data.fieldCount == 0?(
                        TopicCountDown(topicArray.timers),
                        interactTopic(), //显示到互动话题框
                        topicHistory()//得到历史的话题内容
                    ):($('.ToComplete').append('<h6>话题内容保存失败</h6>'));
                });
            }else{
                $id('ViewTpoic').disabled = true;
                $('#ViewTpoic').addClass('disabled');
                $id('topicPostBtn').disabled = false;
                $('#topicPostBtn').removeClass('disabled');
                $id('topicPreview').disabled = false;
                $('#topicPostBtn').removeClass('disabled');
            }
        });
}
/*查看话题结果*/
function ViewTopic(topicArray){
    var topicSituationHtml='',topicFeedbackHtml='';
    if(topicArray.timers !="" && topicArray.actualEndTime ==null ){
        topicSituationHtml  =
            '<div class="topicSituation">' +
                '<h4>本次话题成功推送至<strong id="topicNum" class="text-error">'+topicArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>距离结束还有<span id="topicClock" class="label label-info">0时0分0秒</span></h3>' +
                '<button class="btn btn-danger" id="stopTopic" onclick="earlyTerminationTopic();">提前结束</button>' +
                '<button class="btn btn-success disabled" disabled>系统抽奖</button>'+
                '</div>';
        topicFeedbackHtml   =
            '<div class="topicFeedback">' +
                '<h3>参与人数<span id="topicJoinNum">'+topicArray.totalCount+'</span>人</h3>' +
                '<h3>发言数量<span id="speakTopic">'+topicArray.joinInCount+'</span>条</h3>' +
                '<h3>获奖人数<span id="">0</span> 人</h3>'+
                '<button class="btn btn-primary  disabled" disabled>导出详情</button>' +
                '</div>';
    }else if(topicArray.actualEndTime !=""){
        topicSituationHtml  =
            '<div class="topicSituation">' +
                '<h4>本次话题成功推送至<strong id="topicAllNum" class="text-error">'+topicArray.totalCount+'</strong>台语镜</h4><hr />' +
                '<h3>已结束</h3>' +
                '<button class="btn btn-success disabled" disabled>系统抽奖</button>'+
                '</div>';
        topicFeedbackHtml   =
            '<div class="topicFeedback">' +
                '<h3>参与人数<span>'+topicArray.totalCount+'</span>人</h3>' +
                '<h3>发言数量<span>'+topicArray.joinInCount+'</span>条</h3>' +
                '<h3>获奖人数<span>0</span>人</h3>'+
                '<button class="btn btn-primary  disabled" disabled>导出详情</button>' +
                '</div>';
    }
    var topicPreviewHtml    =
        '<div class="topicPreview">' +
            '<h3>'+topicArray.topicTitle+'</h3>' +
            '<h4>'+topicArray.topicContent+'</h4>' +
            '<button class="btn " onclick="originalTopicForm(topicArray);">原始表单</button>' +
            '</div>';
    $('.FillInForm').html(topicPreviewHtml);
    $('.EffectPreview').html(topicSituationHtml);
    $('.ToComplete').html(topicFeedbackHtml);
}
/*得到话题的反馈结果*/
function topicFeedback(){
    var topicID = getCookie('topicID');
    var bizid = getCookie('topicBizid');
    $.ajax({
        type:'POST',
        url:'/topicFeedback',
        data:{topicID:topicID,bizid:bizid},
        dataType:'json'
    }).done(function(data){
            var res = data.result;
            res.ERRORCODE != 0 ?(
                $('#topicJoinNum').text('0'),
                    setCookie('topicJoinNum',0)
            ):(
                $('#topicJoinNum').text(res.RESULT[0]["totalCount"]),
                setCookie('topicJoinNum',res.RESULT[0]["totalCount"])
            );
            setCookie('speakTopic',data.rows[0]["counts"]);
            $('#speakTopic').text(data.rows[0]["counts"]);
        });
}
/*显示原始话题结构*/
function originalTopicForm(topicArray){
    var actualEndTime =  topicArray.actualEndTime == undefined?('无法统计'):(topicArray.actualEndTime);
    var timers = topicArray.timers ==""?(timeLag(topicArray.startTime,topicArray.endTime)):(topicArray.timers);
    var originalTopicForm  =
        '<ul class="nav">' +
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
                topicPages(data[0]["num"]);
                for(var i=0;i<data.length;i++){
                    topicHistoryHtml +=
                        '<li><a href="javascript:;" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'" onclick="showTopicHistory('+data[i]["id"]+')">'+data[i]["subject"]+'</a></li>';
                }
                $("#TopicHistory").html(topicHistoryHtml);
                $('a[data-toggle|="tooltip"]').tooltip('hide');
                $("#TopicHistory li:even").css('background-color','#AEBDCC');
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
                            '<li><a href="javascript:;" data-placement="right" data-toggle="tooltip" title data-original-title="'+data[i]["startTime"]+'" onclick="showTopicHistory('+data[i]["id"]+')">'+data[i]["text"]+'</a></li>';
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
                timers		: timeLag(data[0]["startTime"],data[0]["endTime"])
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
                topicFeedbackData(),//保存用户反馈情况
                    clearTimeout(topicAccount),
                    //clearInterval(setReplyTopic),
                    $('.IATitle h4').remove(),
                    $('.selectedIA h4').remove(),
                    $('#replyTopic').remove(),
                    $('.alert span').text("话题结束啦，赶快去看看吧！"),
                    $('.alert').removeClass("alert-error").addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
                    topicClock = 0,
                    deleteCookie('topicClock'),
                    deleteCookie('topicID'),
                    deleteCookie('topicBizid'),
                    $id('stopTopic').disabled= true,
                    $('#stopTopic').addClass('disabled'),
                    $('#TopicHistory li:first-child').removeClass('being')
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
/*保存用户反馈数据*/
function topicFeedbackData(){
    var totalCount = getCookie('topicJoinNum');
    var joinInCount = getCookie('speakTopic');
    var topicID = getCookie('topicID');
    $.ajax({
        type:'POST',
        data:{totalCount:totalCount,joinInCount:joinInCount,topicID:topicID},
        url:'/topicFeedbackData',
        dataType:'json'
    }).done(function (data){
            //console.log(data);
        });
    deleteCookie('topicJoinNum');
    deleteCookie('speakTopic');
}
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
                setCookie('topicID',data[0]["topicID"]);
                topicFeedback();//留言人数
                replyTopic();
                //setReplyTopic= setInterval(refreshReplyTopic,10000);//载入留言
                selectedReplyTopic();   //载入已选播的留言
                newTopicArray = {
                    topicTitle      :   data[0]["subject"],
                    topicContent    :   data[0]["text"],
                    totalCount      :   data[0]["totalCount"],
                    joinInCount     :   data[0]["joinInCount"],
                    actualEndTime   :   data[0]["actualEndTime"],
                    startTime       :   data[0]["startTime"],
                    endTime         :   data[0]["endTime"],
                    timers		: timeLag(data[0]["startTime"],data[0]["endTime"])
                }
                var html = '<h4 class="muted"><a href="javascript:;" onclick="ViewTopic(newTopicArray);">'+data[0]["subject"]+'</a></h4>';
                $('.IATitle').html(html);
            }
        });
}
/*互动话题留言*/
function replyTopic(){
    var topicID = getCookie('topicID');
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
                refreshReplyTopic();
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
                    '<a href="javascript:;" class="btn btn-mini btn-primary" onclick="anycastTopic('+data[i]["id"]+')">选播</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                    '</h5>' +
                '</li>';
        }else{
            replyTopicHtml +=
                '<li class="label" id=replyTopic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:;" onclick="anycastTopic('+data[i]["id"]+')" class="btn btn-mini btn-primary">选播</a>' +
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
function refreshReplyTopic(){
    topicFeedback();//留言人数
    var topicID = getCookie('topicID');
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
                    rightStatus == 0?($(".showIA").scrollTop(document.getElementById("replyTopic").scrollHeight)):('')):('');
            });
        rightStatus == 0?($(".showIA").scrollTop(document.getElementById("replyTopic").scrollHeight)):('');
    }else{
        replyTopic();
    }
}
function newReplyTopic(data){
    var newReplyTopicHtml = '';
    for(var i=0;i<data.length;i++){
        if(data[i]["supportOnline"] ==1){
            newReplyTopicHtml +=
                '<li class="label" id=replyTopic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:;" onclick="anycastTopic('+data[i]["id"]+')" class="btn btn-mini btn-primary">选播</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式"  >可联线</a>' +
                    '</h5>' +
                '</li>';
        }else{
            newReplyTopicHtml +=
                '<li class="label" id=replyTopic'+data[i]["id"]+' name='+data[i]["id"]+'>' +
                    '<h5>' +
                    '<span>'+data[i]["text"]+'</span>' +
                    '<span>'+data[i]["time"]+'</span>' +
                    '<a href="javascript:;" onclick="anycastTopic('+data[i]["id"]+')" class="btn btn-mini btn-primary">选播</a>' +
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
        data:{id:id},
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
                    '<a href="javascript:;" onclick="RemoveReplyTopic('+data[0]["id"]+')" class="btn btn-mini btn-primary">移除</a>' +
                    '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[0]["nickname"]+',语镜号'+data[0]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                    '</h5>';
            }else{
                html = '<h5 id=removeReplyTopic'+data[0]["id"]+'>' +
                    '<span>'+data[0]["text"]+'</span>' +
                    '<span>'+data[0]["time"]+'</span>' +
                    '<a href="javascript:;" onclick="RemoveReplyTopic('+data[0]["id"]+')" class="btn btn-mini btn-primary">移除</a>' +
                    '</h5>';
            }
            $('.selectedIA').append(html);
            $("a[data-toggle=popover]").popover('hide');
        });
}
/*已选播未关闭的留言*/
function selectedReplyTopic(){
    var topicID = getCookie('topicID');
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
                        '<a href="javascript:;" onclick="RemoveReplyTopic('+data[i]["id"]+')" class="btn btn-mini btn-primary">移除</a>' +
                        '<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data[i]["nickname"]+',语镜号'+data[i]["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>' +
                        '</h5>';
                }else{
                    html = '<h5 id=removeReplyTopic'+data[i]["id"]+'>' +
                        '<span>'+data[i]["text"]+'</span>' +
                        '<span>'+data[i]["time"]+'</span>' +
                        '<a href="javascript:;" onclick="RemoveReplyTopic('+data[i]["id"]+')" class="btn btn-mini btn-primary">移除</a>' +
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
    if($('.selectedIA h5').length > 0 ){
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
    }else{
        $('.alert span').text("没有什么好关闭的"),
            $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
    }
}
/*电台路况*/
function trafficStatusDJ(){
    emptyHtml();
    $('.appArea ul li:first-child').removeClass("active");
    $('.appArea ul li:nth-child(2)').removeClass("active");
    $('.appArea ul li:nth-child(3)').addClass("active");
    var RadioTrafficHtml = '<ul class="nav nav-list">' +
        '<li>' +
        '<a class="btn" href="javascript:;"onclick="radioTraffic()">发起一个路况分享</a>' +
        '</li>' +
        '<ul class="nav nav-list" id="radioTrafficHistory"></ul>' +
        '</ul>';
    $('#New').html(RadioTrafficHtml);
    $('#Page').addClass('hide');
}
function radioTraffic(){
    var  newRadioTrafficHtml = '<ul class="nav">' +
        '<li class="form-inline"><label for="onRoad">堵点位置：</label>' +
        '<div class="input-prepend"><span class="add-on">在</span><input class="input-small"id="onRoad" type="text" placeholder="道路名称" /></div>' +
        '<div class="input-prepend"><span class="add-on">近</span><input class="input-small"id="nearRoad" type="text" placeholder="道路名称" /></div>' +
        '<button class="btn btn-mini" onclick="locations()">在地图上定位</button>' +
        '</li>' +
        '<li class="form-inline"><label for="direction">行驶方向：</label><input type="text" name="" id="direction" class="span5" data-toggle="popover" data-placement="right" title="" data-original-title="行驶方向" data-html="true"/></li>' +
        '<li class="form-inline"><label for="jamReason">拥堵原因：</label><input type="text" name="" id="jamReason" class="span5" data-toggle="popover" data-placement="right" title="" data-original-title="拥堵原因" data-html="true"/></li>' +
        '<li class="form-inline"><label for="jamState">拥堵状况：</label><input type="text" name="" id="jamState" class="span5" data-toggle="popover" data-placement="right" title="" data-original-title="拥堵状况" data-html="true"/></li>' +
        '<li class="form-inline"><label for="suggestion">防堵建议：</label><input type="text" name="" id="suggestion" class="span5" data-toggle="popover" data-placement="right" title="" data-original-title="防堵建议" data-html="true"/></li>' +
        '<li><lable for="coverage">覆盖范围：</lable><select class="span5" id="coverage">' +
        '<option value="1000">1千米</option><option value="2000">2千米</option>' +
        '<option value="3000">3千米</option><option value="4000">4千米</option>' +
        '<option value="5000">5千米</option><option value="6000">6千米</option>' +
        '<option value="1000">7千米</option><option value="2000">8千米</option>' +
        '<option value="9000">9千米</option><option value="10000">10千米</option>' +
        '</select></li>' +
        '<button class="btn" id="rtPreviewBtn" onclick="radioTrafficPreview()">预览</button>' +
        '<span class="text-error radio_error hide"></span>' +
        '</ul>';
    $('.FillInForm').html(newRadioTrafficHtml);
    $('#direction').popover({'content':'<button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由东向西</button>\
                <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由西向东</button>\
               <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由南向北</button>\
                <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由北向南</button>\
                <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由西南向东北</button>\
                <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由西北向东南</button>\
                <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由东北向西南</button>\
                <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">由东南向西北</button>\
                 <button targetTo="#direction" class="btn btn-mini btn-info fastButton" type="button">双向车道</button>'});
    $('#jamReason').popover({'content':'<button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">道路施工</button>\
		        <button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">交通事故</button>\
                <button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">警察临检</button>\
			    <button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">交通管制</button>\
				<button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">匝道封闭</button>\
				<button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">路面异物</button>\
				<button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">体育赛事</button>\
				<button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">交通路口并道</button>\
				<button targetTo="#jamReason" class="btn btn-mini btn-info fastButton" type="button">位置原因</button>'});
    $('#jamState').popover({'content':'<button targetTo="#jamState" class="btn btn-mini btn-info fastButton" type="button">严重堵车</button>\
		        <button targetTo="#jamState" class="btn btn-mini btn-info fastButton" type="button">基本瘫痪</button>\
                <button targetTo="#jamState" class="btn btn-mini btn-info fastButton" type="button">车行缓慢</button>\
				<button targetTo="#jamState" class="btn btn-mini btn-info fastButton" type="button">恢复通行</button>\
				<button targetTo="#jamState" class="btn btn-mini btn-info fastButton" type="button">部分车道拥堵</button>'});
    $('#suggestion').popover({'content':'<button targetTo="#suggestion" class="btn btn-mini btn-info fastButton" type="button">绕道行驶</button>\
		        <button targetTo="#suggestion" class="btn btn-mini btn-info fastButton" type="button">不建议前往</button>\
		        <button targetTo="#suggestion" class="btn btn-mini btn-info fastButton" type="button">按顺序通行</button>\
                <button targetTo="#suggestion" class="btn btn-mini btn-info fastButton" type="button">不要抢道</button>'});

}
function locations(){
    var cityName = getCookie('cityName');
    var road1 = checkstr($('#onRoad').val());
    var road2 = checkstr($('#nearRoad').val());
    roadSearch(road1,road2,cityName);
}
var $doc = $(document);
$(function (){
    $doc.on('click', '.fastButton', function () {
        var $visible = $('.FillInForm');
        $visible.find($(this).attr('targetTo')).val($(this).text());
    });

    $('#myTab a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
});
function radioTrafficPreview(){
  radioTrafficArray = {
    onRoad : checkstr($('#onRoad').val()),
    nearRoad : checkstr($('#nearRoad').val()),
    direction : checkstr($('#direction').val()),
    jamReason : checkstr($('#jamReason').val()),
    jamState   : checkstr($('#jamState').val()),
    suggestion  : checkstr($('#suggestion').val()),
    coverage    : $('#coverage').val()
  }
  if(radioTrafficArray.onRoad == "" || radioTrafficArray.nearRoad == ""){
      $('.radio_error').css('display','inline').text("请输入道路名称！").fadeOut(7500);
  }else if(radioTrafficArray.direction == "" || radioTrafficArray.jamReason == "" || radioTrafficArray.jamState == "" || radioTrafficArray.suggestion == "" ){
      $('.radio_error').css('display','inline').text("请输入完整信息！").fadeOut(7500);
  }else if(getCookie('lng') ==undefined && getCookie('lat') ==undefined){
      $('.radio_error').css('display','inline').text("请输入点击定位！").fadeOut(7500);
  }else{
      var roadTrafficHtml = '<h4>道客路况快报：</h4>' +
          '<h3 id="rtContent">在'+radioTrafficArray.onRoad+'近'+radioTrafficArray.nearRoad+','+radioTrafficArray.direction+','+radioTrafficArray.jamReason+','+radioTrafficArray.jamState+','+radioTrafficArray.suggestion+'</h3>' +
          '<button class="btn" id="rtPostBtn" onclick="rtPost(radioTrafficArray);">确认发布</button>';
      $('.EffectPreview').html(roadTrafficHtml);
  }
}

function rtPost(data){
    $('.ToComplete').html('<h3 class="text-info">正在发送请等待......</h3>');
    var rtContent = $('#rtContent').text();
    $.ajax({
       type:'POST',
       url:'/radioTraffic',
       data:{
           text:rtContent,
           trafficRoad:radioTrafficArray["onRoad"][0],
           nearRoad:radioTrafficArray["nearRoad"][0],
           direction:radioTrafficArray["direction"][0],
           reason:radioTrafficArray["jamReason"][0],
           state:radioTrafficArray["jamState"][0],
           suggestion:radioTrafficArray["suggestion"][0],
           lng:getCookie('lng'),
           lat:getCookie('lat')
       },
       dataType:'json'
    }).done(function (data){
        data.ERRORCODE == 0?(
            $id('rtPostBtn').disabled = true,
            $('#rtPostBtn').addClass('disabled'),
            deleteCookie('lng'),
            deleteCookie('lat'),
            $('.ToComplete').html('<h3 class="text-success">亲，活动发布成功！</h3>')
        ):(
            $('.ToComplete').html('<h3 class="text-error">亲，活动发布失败！</h3>')
        );
    });
}
var trafficID="",DJTrafficID="";
function getTrafficStatus(){
    var cityName = getCookie('cityName');
    //alert(cityName);
    var radioStationName = getCookie('radioStationName');
    $.ajax({
        type:'POST',
        data:{cityName:cityName},
        url:'/getTrafficStatus',
        dataType:'json'
    }).done( function(data){
            if(data.ERRORCODE == 0 && data.RESULT != 0 ){
                for(var i=0;i<data.RESULT.length;i++){
                    if(data.RESULT[i]["provider"] == radioStationName && timeLagToday(data.RESULT[i]["startTime"]) == 0){
                            var dj = data.RESULT[i];
                            DJTrafficID += data.RESULT[i]["id"]+',';
                            setCookie('DJTrafficID',DJTrafficID.slice(0,-1));
                            showDJTraffic(dj);
                      }else if(timeLagToday(data.RESULT[i]["startTime"]) == 0){
                            trafficID += data.RESULT[i]["id"]+',';
                            var traffic = data.RESULT[i];
                            setCookie('trafficID',trafficID.slice(0,-1));
                            showTraffic(traffic);
                      }
                }
            }
    });
}
var DJStatus = 0;
function showDJTraffic(data){
    $('#home').mouseenter(function (){
        DJStatus = 1;
    }).mouseleave(function(){
        DJStatus = 0;
    });
    var id =  delRepeat((getCookie('DJTrafficID')).split(","));
    var lastid =$('#DJtraffic li:last-child').attr("name");
    var trafficHtml='';
    if(lastid == undefined){
        trafficHtml = '<li class="label" id=DJtraffic'+data["id"]+' name='+data["id"]+'>' +
            '<h5>' +
            '<span id="trafficRoad'+data["id"]+'">'+data["trafficRoad"]+'近</span>' +
            '<span id="nearRoad'+data["id"]+'">'+data["nearRoad"]+'</span>' +
            '<span id="direction'+data["id"]+'">'+data["direction"]+'</span>' +
            '<span id="reason'+data["id"]+'">因'+data["reason"]+'</span>' +
            '<span id="state'+data["id"]+'">'+data["state"]+'</span>' +
            '<span class="hide" id="text'+data["id"]+'">'+data["text"]+'</span>' +
            '<span>'+data["startTime"]+'</span>' +
            '<a href="javascript:;" onclick="addTrafficOnMap('+data["longitude"]+','+data["latitude"]+')" class="btn btn-mini">定位</a>' +
            '</h5>' +
        '</li>';
    }else if(data.id > lastid && jQuery.inArray(data.id,id) != "-1"){
        trafficHtml = '<li class="label" id=DJtraffic'+data["id"]+' name='+data["id"]+'>' +
            '<h5>' +
            '<span id="trafficRoad'+data["id"]+'">'+data["trafficRoad"]+'近</span>' +
            '<span id="nearRoad'+data["id"]+'">'+data["nearRoad"]+'</span>' +
            '<span id="direction'+data["id"]+'">'+data["direction"]+'</span>' +
            '<span id="reason'+data["id"]+'">因'+data["reason"]+'</span>' +
            '<span id="state'+data["id"]+'">'+data["state"]+'</span>' +
            '<span class="hide" id="text'+data["id"]+'">'+data["text"]+'</span>' +
            '<span>'+data["startTime"]+'</span>' +
            '<a href="javascript:;" onclick="addTrafficOnMap('+data["longitude"]+','+data["latitude"]+')" class="btn btn-mini">定位</a>' +
            '</h5>' +
        '</li>';
    }
    var result = juicer(trafficHtml,data);
    $('#DJtraffic').append(result);
    DJStatus == 0?($("#home").scrollTop(document.getElementById("DJtraffic").scrollHeight)):('');
    $('#DJtraffic li:even').css('background-color','#6DAFF7');
    $('#DJtraffic li:odd').css('background-color','#9EDDA3');
}
var leftStatus = 0;
function showTraffic(data){
    $('#traffic').mouseenter(function (){
        leftStatus = 1;
    }).mouseleave(function(){
        leftStatus = 0;
    });
    var id =  delRepeat((getCookie('trafficID')).split(","));
    var anycastID =  getCookie('anycastTrafficID');
    anycastID = anycastID == null?([""]):(anycastID.split(","));
    var lastid =$('#traffic li:last-child').attr("name");
    var trafficHtml='';
    if(lastid == undefined && jQuery.inArray(data.id,anycastID) == "-1"){
        trafficHtml =
            '<li class="label" id=traffic'+data["id"]+' name='+data["id"]+'>' +
                '<h5>' +
                    '<span id="trafficRoad'+data["id"]+'">'+data["trafficRoad"]+'近</span>' +
                    '<span id="nearRoad'+data["id"]+'">'+data["nearRoad"]+'</span>' +
                    '<span id="direction'+data["id"]+'">'+data["direction"]+'</span>' +
                    '<span id="reason'+data["id"]+'">因'+data["reason"]+'</span>' +
                    '<span id="state'+data["id"]+'">'+data["state"]+'</span>' +
                    '<span class="hide" id="text'+data["id"]+'">'+data["text"]+'</span>' +
                    '<span class="hide" id="longitude'+data["id"]+'">'+data["longitude"]+'</span>' +
                    '<span class="hide" id="latitude'+data["id"]+'">'+data["latitude"]+'</span>' +
                    '<span class="hide" id="sign'+data["id"]+'">'+data["sign"]+'</span>' +
                    '<span class="hide" id="agent'+data["id"]+'">'+data["agent"]+'</span>' +
                    '<span class="hide" id="serviceType'+data["id"]+'">'+data["serviceType"]+'</span>' +
                    '<span>'+data["startTime"]+'</span>' +
                    '{@if longitude!=undefined}<a href="javascript:;" onclick="addTrafficOnMap('+data["longitude"]+','+data["latitude"]+')" class="btn btn-mini">定位</a>{@/if}' +
                    '<a href="javascript:;" onclick="anycastTraffic('+data["id"]+')" class="btn btn-mini btn-primary">选播</a>' +
                    '{@if supportOnline ==1}<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data["nickname"]+',语镜号'+data["provider"]+'" data-original-title="联系方式">可联线</a>{@/if}' +
                '</h5>' +
            '</li>';
    }else if(data.id > lastid && jQuery.inArray(data.id,anycastID) == "-1"){
        trafficHtml =
            '<li class="label" id=traffic'+data["id"]+' name='+data["id"]+'>' +
                '<h5>' +
                    '<span id="trafficRoad'+data["id"]+'">'+data["trafficRoad"]+'近</span>' +
                    '<span id="nearRoad'+data["id"]+'">'+data["nearRoad"]+'</span>' +
                    '<span id="direction'+data["id"]+'">'+data["direction"]+'</span>' +
                    '<span id="reason'+data["id"]+'">因'+data["reason"]+'</span>' +
                    '<span id="state'+data["id"]+'">'+data["state"]+'</span>' +
                    '<span class="hide" id="text'+data["id"]+'">'+data["text"]+'</span>' +
                    '<span class="hide" id="longitude'+data["id"]+'">'+data["longitude"]+'</span>' +
                    '<span class="hide" id="latitude'+data["id"]+'">'+data["latitude"]+'</span>' +
                    '<span class="hide" id="sign'+data["id"]+'">'+data["sign"]+'</span>' +
                    '<span class="hide" id="agent'+data["id"]+'">'+data["agent"]+'</span>' +
                    '<span class="hide" id="serviceType'+data["id"]+'">'+data["serviceType"]+'</span>' +
                    '<span>'+data["startTime"]+'</span>' +
                    '{@if longitude!=undefined}<a href="javascript:;" onclick="addTrafficOnMap('+data["longitude"]+','+data["latitude"]+')" class="btn btn-mini">定位</a>{@/if}' +
                    '<a href="javascript:;" onclick="anycastTraffic('+data["id"]+')" class="btn btn-mini btn-primary">选播</a>' +
                    '{@if supportOnline ==1}<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data["nickname"]+',语镜号'+data["provider"]+'" data-original-title="联系方式">可联线</a>{@/if}' +
                '</h5>' +
            '</li>';
    }
    var result = juicer(trafficHtml,data);
    $('#traffic').append(result);
    $("a[data-toggle=popover]").popover('hide');
    leftStatus == 0?($("#div1").scrollTop(document.getElementById("traffic").scrollHeight)):('');
    $('#traffic li:even').css('background-color','#6DAFF7');
    $('#traffic li:odd').css('background-color','#9EDDA3');
}
/*选播路况信息*/
function anycastTraffic(data){
    var id=data;
    var trafficInfo = {
        trafficRoad:$('#trafficRoad'+id).text(),
        direction:$('#direction'+id).text(),
        reason:$('#reason'+id).text(),
        state:$('#state'+id).text(),
        longitude:$('#longitude'+id).text(),
        latitude:$('#latitude'+id).text(),
        sign:$('#sign'+id).text(),
        serviceType:$('#serviceType'+id).text(),
        agent:$('#agent'+id).text(),
        text:$('#text'+id).text()
    }
    $.ajax({
        url:'/saveAnycastTraffic',
        type:'POST',
        data:{id:id,text:trafficInfo.text,longitude:trafficInfo.longitude,latitude:trafficInfo.latitude,jamLocation:trafficInfo.trafficRoad,direction:trafficInfo.direction,jamReason:trafficInfo.reason,jamState:trafficInfo.state,agent:trafficInfo.agent,serviceType:trafficInfo.serviceType,sign:trafficInfo.sign},
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
var anycastID = "";
function showanycastTraffic(data){
    anycastID += data+',';
    setCookie('anycastTrafficID',anycastID.slice(0,-1));
    var anycastTraffichtml='';
    $.ajax({
        url:'/showAnycast',
        type:'POST',
        data:{id:data,table:1},
        dataType:'json'
    }).done(function(data){
        data = data[0];
        anycastTraffichtml =
            '<h5 id=removeTraffic'+data["id"]+'>' +
                '<span>'+data["text"]+'</span>' +
                '{@if longitude != 0}<a href="javascript:;" onclick="addTrafficOnMap('+data["longitude"]+','+data["latitude"]+')" class="btn btn-mini">定位</a>{@/if}' +
                '<a href="javascript:;" onclick="RemoveTraffic('+data["id"]+')" class="btn btn-mini btn-primary">移除</a>' +
                    '{@if supportOnline != 0}<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+data["nickname"]+',语镜号'+data["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>{@/if}' +
            '</h5>';
        var result = juicer(anycastTraffichtml,data);
        $('#div0').append(result);
        $("a[data-toggle=popover]").popover('hide');
        $('#div1').height($('#div1').height()-$('#'+'removeTraffic'+data["id"]).height()-10);
        $("#div1").scrollTop(document.getElementById("traffic").scrollHeight);
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
                    $('#div1').height($('#div1').height()+$('#removeTraffic'+id).height()+10),
                    $('#removeTraffic'+id).remove()
                ):(
                $('.alert span').text("选播路况移除失败！"),
                    $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
                );
        });
}
/*移除全部已选播路况*/
function removeTrafficAll(){
    if($("#div0 h5").length >0){
        $.ajax({
            type:'POST',
            data:{table:1},
            url:'/CloseAll',
            dataType:'json'
        }).done(function (data){
                data.fieldCount ==0?(
                    $('.alert span').text("选播路况已全部移除！"),
                        $('.alert').addClass("alert-success").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000),
                        $('#div1').height($('#div1').height()+$('#div0').height()+10),
                        $('#div0 h5').remove()
                ):(
                    $('.alert span').text("选播路况移除失败！"),
                        $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000)
                );
            });
    }else{
        $('.alert span').text("没有什么好关闭的");
        $('.alert').addClass("alert-error").css("display","block").animate({"top": "-5%"}, "slow").fadeOut(10000);
    }
}
/*已选播未关闭的路况*/
function selectedTraffic(){
    $.ajax({
        type:'POST',
        url:'selectedTraffic',
        dataType:'json'
    }).done(function (data){
        var selectedTraffic="",datas="";
        if(data==""){
            $('#div1').height($('#div1').height()-$('#div0').height());
        }else{
            for(var i=0;i<data.length;i++){
                datas = data[i];
                selectedTraffic =
                    '<h5 id=removeTraffic'+datas["id"]+'>' +
                        '<span>'+datas["text"]+'</span>' +
                        '{@if longitude!=0}<a href="javascript:;" onclick="addTrafficOnMap('+datas["longitude"]+','+datas["latitude"]+')" class="btn btn-mini">定位</a>{@/if}' +
                        '<a href="javascript:;" onclick="RemoveTraffic('+datas["id"]+')" class="btn btn-mini btn-primary">移除</a>' +
                        '{@if supportOnline != 0}<a href="javascript:;" title class="btn btn-mini btn-success" data-toggle="popover"  data-placement="right" data-content="昵称'+datas["nickname"]+',语镜号'+datas["mirrtalkNumber"]+'" data-original-title="联系方式">可联线</a>{@/if}' +
                    '</h5>';
                var result = juicer(selectedTraffic,datas);
                $('#div0').append(result);
                $("a[data-toggle=popover]").popover('hide');
            }
            $('#div1').height($('#div1').height()-$('#div0').height()-9);
        }
    });
}
/*已经选播和关闭的ID*/
function unID() {
    $.ajax({
        type:'POST',
        url:'/getUnID',
        dataType:'json'
    }).done(function (data){
        for(var i=0;i<data.length;i++){
            anycastID +=data[i].id+',';
        }
        getCookie('anycastTrafficID',anycastID.slice(0,-1));
    });
}
/*根据输入内容使路况信息里的关键字高亮*/
(function searchKeywords(){
    var keywords='';
    $('#keywords').change(function (){
        keywords = $(this).val();
        $('#div1').textSearch(keywords);
    });
})();
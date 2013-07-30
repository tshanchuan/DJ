/*
 * GET home page.路由功能
 * get  方法是实现当用户试图访问这个网页时要显示什么
 * post 方法是当从这个网页上发出数据（这里是提交表单）时要干些什么
 * render函数 是当你要访问比如主页时，服务器找到index.ejs文件
 */
var site = require('../controller/site');
module.exports = function(app){
    app.get('/index',site.index); //显示主页
    app.get('/initDJ',site.initDJ);  //初始化DJ系统
    app.post('/History',site.requestHistory);               //历史【投票/话题】分页显示
    app.post('/DistrictWeibo',site.requestDistrictWeibo);//发送【投票/话题】

    app.post('/saveVote',site.requestsaveVote);         //保存【投票】
    app.post('/saveTopic',site.requestsaveTopic);     //保存【话题】
    app.post('/showTopic',site.requestshowTopic);     //显示【互动话题】
    app.post('/showReplyTopic',site.showReplyTopic);     //显示【互动话题留言】
    app.post('/refreshReplyTopic',site.refreshReplyTopic);     //得到最新的【互动话题留言】

    app.post('/updateTime',site.updateTime);        //更新【投票/话题】实际结束时间

    app.post('/voteFeedback',site.requestvoteFeedback);         //投票反馈
    app.post('/voteFeedbackData',site.voteFeedbackData);         //保存投票反馈结果到库
    app.post('/topicFeedback',site.requesttopicFeedback);         //话题反馈
    app.post('/topicFeedbackData',site.topicFeedbackData);         //保存话题反馈结果到库

    app.post('/topicToTsp',site.requesttopicToTsp);       //TSP请求有效的话题内容
    app.post('/replyTopic',site.replyTopic);              //语镜用户通过TSP回复话题
    app.post('/showVoteHistory',site.showVoteHistory);          //显示历史【投票】详情
    app.post('/showTopicHistory',site.showTopicHistory);       //显示历史【话题】详情

    app.post('/saveAnycastTraffic',site.saveAnycastTraffic);    //存入选播的互动路况
    app.post('/Anycast',site.requestanycast);            //选播一条【留言】更改他的状态
    app.post('/Close',site.requestClose);               //关闭一条选播【路况】/【留言】更改他的状态
    app.post('/CloseAll',site.requestCloseAll);        //关闭全部选播【路况】/【留言】更改他的状态
    app.post('/showAnycast',site.showAnycast);             //显示选播的【路况】/【留言】
    app.post('/selectedTraffic',site.selectedTraffic);    //页面载入得到已选播的路况
    app.post('/getUnID',site.getUnID);    //页面载入得到已选播和已关闭路况的ID
    app.post('/selectedReplyTopic',site.selectedReplyTopic); //页面载入得到已选播的留言

    app.post('/radioTraffic',site.radioTraffic); //DJ保存互动路况
    app.post('/getTrafficStatus',site.getTrafficStatus); //获取互动路况



    app.all('*', site.notFound);                            //404页面
};


/*
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-16
 * Time: 下午7:14
 * To change this template use File | Settings | File Templates.
 */
/**
 * config
 */
exports.config = {
    debug:true,
    name:'DJ',
    description:'Node Club 是用Node.js开发的社区软件',
    version:'0.9', // site settings
    host:'localhost.cnodejs.org',
    site_logo:'', // default is `name`
    site_static_host:'', // 静态文件存储域
    site_enable_search_preview:false, // 开启google search preview
    site_google_search_domain:'cnodejs.org', // google search preview中要搜索的域
    db:'mongodb://127.0.0.1/node_club_dev',
    session_secret:'DJ',
    auth_cookie_name:'DJ',
    port:'3000',
    apiService:{
        'main':{
            host:'192.168.1.197',
            port:'9092',
            path:'/',
            method:'POST'
        },
        'secret':'ED535F039B0B000C3DEC0A277DA05738C8C48E4F',
        'agent':'dj86fedaff',
        'cityCode':'101040100',
        'serviceType':'732767'
    },
    queryBase:{
        host:'192.168.1.186',
        user:'dj',
        password:'djabc123',
        database:'dj'
    },
    vote:{
        host:'192.168.1.197',
        port:'9092',
        path:'/',
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    voteFeedback:{
        host:'192.168.1.197',
        port:'9092',
        path:'/',
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    trafficStatus:{
        serviceType:"a2d387",
        broadcast:'0'
    },
    redis:{
        host:'192.168.1.165',
        port:'6379'
    }
};

/**
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
    site_static_host:'', // 静态文件存储域名
    site_enable_search_preview:false, // 开启google search preview
    site_google_search_domain:'cnodejs.org', // google search preview中要搜索的域名
    session_secret:'DJ',
    auth_cookie_name:'DJ',
    port:'3000',
    apiService:{
        'main':{
            host:'192.168.1.110',
            port:'3000',
            path:'/',
            method:'POST'
        },
        'secret':'ED535F039B0B000C3DEC0A277DA05738C8C48E4F',
        'agent':'dj86fedaff',
        'serviceType':'732767'
    },
    queryBase:{
        host:'192.168.1.3',
        user:'dj',
        password:'djabc123',
        database:'dj'
    },
    vote:{
        host:'192.168.1.6',
        port:'6000',
        path:'/addDistrictWeibo.json',
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    voteFeedback:{
        host:'192.168.1.6',
        port:'6000',
        path:'/feedbackStat.json',
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    inserttrafficStatus:{
        host:'192.168.1.6',
        port:'80',
        path:'/insertTraffic',
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    gettrafficStatus:{
        host:'192.168.1.6',
        port:'80',
        path:'/getTraffic',
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    redis:{
        host:'192.168.1.3',
        port:'6379'
    },
    cityInfo:{
        city:[{
            cityName:'北京市',
            cityCode :'110000',
            y:'39.904989',
            x:'116.405285'
        },{
            cityName:'上海市',
            cityCode :'310000',
            y:'31.231706',
            x:'121.472644'
        },{
            cityName:'杭州市',
            cityCode :'330100',
            y:'30.287459',
            x:'120.153576'
        },{
            cityName:'深圳市',
            cityCode :'440300',
            y:'22.547',
            x:'114.085947'
        },{
            cityName:'重庆市',
            cityCode:'500000',
            y:'29.533155',
            x:'106.504962'
        }]
    }
};
/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-17
 * Time: 上午10:07
 * To change this template use File | Settings | File Templates.
 */
var mapObj,toolbar,overview,scale,Trafficlay,map;

function mapInit(x,y){

    var opt = {

        level:13,//初始地图视野级别

        center:new MMap.LngLat(x,y),//设置地图中心点

        doubleClickZoom:true,//双击放大地图

        scrollWheel:true//鼠标滚轮缩放地图

    }

    mapObj = new MMap.Map("iCenter",opt);

    mapObj.plugin(["MMap.ToolBar","MMap.OverView","MMap.Scale"],function()

    {

        toolbar = new MMap.ToolBar({autoPosition:false});

        mapObj.addControl(toolbar);

        toolbar.getLocation();//获得定位信息

        overview = new MMap.OverView(); //加载鹰眼

        mapObj.addControl(overview);

        scale = new MMap.Scale(); //加载比例尺

        mapObj.addControl(scale);

        mapObj.bind(mapObj,"mousewheel",addTileLayer_TRAFFIC);


    });

}

/*添加实时交通层*/
function addTileLayer_TRAFFIC(){

    mapObj.removeLayer("t");

    Trafficlay = new MMap.TileLayer({

        tileSize:256,//图像大小

        id:"t",

        getTileUrl:function(x,y,z){

            return "http://tm.mapabc.com/trafficengine/mapabc/traffictile?v=1.0&t=1&zoom="+(17-z)+"&x="+x+"&y="+y;

        }

    });

    mapObj.addLayer(Trafficlay);

}
/*删除实时交通层*/
function removeTileLayer_TRAFFIC(){

    mapObj.removeLayer("t");

}
/*添加路况坐标点*/
function addTrafficOnMap(lot,lat){

    var icoArray =["green","blue","red","orange"];

    var icon = icoArray[Math.floor(Math.random()*4)];

    var marker = new MMap.Marker({

        id:"t", //marker id

        position:new MMap.LngLat(lot,lat), //位置

        icon:"images/"+icon+"5.png",//复杂图标

        offset:new MMap.Pixel(0,-36), //相对于基点的偏移量

        draggable:false, //可拖动

        cursor:"default",//鼠标悬停时显示的光标

        visible:true//可见

    });

    mapObj.addOverlays(marker);

    mapObj.setZoomAndCenter(15,new MMap.LngLat(lot,lat));//同时设置地图的中心点及zoom级别

}
/*交叉路口查询*/
function roadSearch(road1,road2,city){

    var RoadSearchOption = {

        number:1,//每页数量,默认10

        batch:1,//请求页数，默认1

        ext:""//扩展字段

    };

    var road = new MMap.RoadSearch(RoadSearchOption);

    road.roadCrossSearchByRoadNames(road1,road2,city,function(data){

       data.list == undefined?(
           $('.radio_error').css('display','inline').text("无法定位！").fadeOut(7500)
       ):(
        addTrafficOnMap(data.list[0]["x"],data.list[0]["y"]),
        setCookie('lng',data.list[0]["x"]),
        setCookie('lat',data.list[0]["y"])
       );
    });
}

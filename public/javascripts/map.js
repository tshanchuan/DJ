/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-17
 * Time: 上午10:07
 * To change this template use File | Settings | File Templates.
 */
var mapObj,toolbar,overview,scale;

function mapInit()

{

    var opt = {

        level:13,//初始地图视野级别

        //center:new MMap.LngLat(121.47190996,31.23221255),//设置地图中心点

        doubleClickZoom:true,//双击放大地图

        scrollWheel:true//鼠标滚轮缩放地图

    }

    mapObj = new MMap.Map("iCenter",opt);

    mapObj.plugin(["MMap.ToolBar","MMap.OverView","MMap.Scale"],function()

    {

        toolbar = new MMap.ToolBar();

        toolbar.autoPosition=false; //加载工具条

        mapObj.addControl(toolbar);

        overview = new MMap.OverView(); //加载鹰眼

        mapObj.addControl(overview);

        scale = new MMap.Scale(); //加载比例尺

        mapObj.addControl(scale);

        mapObj.bind(mapObj,"mousewheel",addTileLayer_TRAFFIC);

    });

    mapObj.setCity("上海市");

}

var Trafficlay,subwaylay,customlay;
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
function addTrafficOnMap(lat,lot){

    var icoArray =["green","blue","red","orange"];

    var icon = icoArray[Math.floor(Math.random()*4)];

    var marker = new MMap.Marker({

        id:"t", //marker id

        position:new MMap.LngLat(lat,lot), //位置

        icon:"images/"+icon+"5.png",//复杂图标

        offset:new MMap.Pixel(0,-36), //相对于基点的偏移量

        draggable:false, //可拖动

        cursor:"default",//鼠标悬停时显示的光标

        visible:true//可见

    });

    mapObj.addOverlays(marker);

    mapObj.setFitView();//设置地图合适视野级别

}

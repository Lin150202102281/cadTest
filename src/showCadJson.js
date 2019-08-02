'use strict'

const THREE = require('three');
const Stats = require('../lib/stats');
const OrbitControls = require('../lib/OrbitControls');
const data = require('../res/data/dxfdata.json');
const colorsMapper = require('autocad-colors-index');
const TTFLoader = require('../lib/TTFLoader');

//const FontDataJSON = require('../res/fonts/json/BenMoJSON.json');
//const FontDataJSON = require('../res/fonts/json/fzyt.json');
//const FontDataJSON = require('../res/fonts/json/helvetiker_regular.typeface.json');

const FontDataSimsun = require('../res/fonts/ttf/simsun.ttf');
const FontDataHeiti = require('../res/fonts/ttf/heiti.ttf');




function showCadJson(){


    var scene;
    var camera;
    var render;
    var webglRender;
    //var canvasRender;
    var controls;
    var stats;

    
    var fontTTF = {
        simsun:'',
        heiti:''
    };

    var blockInf = [];


    window.onload=function(){
        stats = initStats();
       

        initRenderer()
        initCamera();
        
        //坐标轴
        initAxis();
    
       
    

        var promise = runAsync().then(function (res) {

            loadData(data);

            calHandle();

        });


        
        renderScene();
    }
   

    function runAsync () {
            var loader = new TTFLoader();
            var fontLoader = new THREE.FontLoader();
            var promise = new Promise(function (resolve, reject) {
                loader.load(FontDataSimsun,function(fnt){
                    fontTTF.simsun = fontLoader.parse(fnt);
                }); 

                loader.load(FontDataHeiti,function(fnt){
                    fontTTF.heiti = fontLoader.parse(fnt);
                    resolve(fontTTF);
                }); 
            });
            return promise;
    }
        




    function loadData(data){
       
        data.forEach(function(element){
            var matrix = (new THREE.Matrix4().fromArray(element.transform.split(',').map(Number))).transpose() || new THREE.Matrix4();
            var color = element.color ? calColor(element.color) : 0xFFFFFF;
            switch(element.type){
                case "DxfLine":
                    var startPoint = new THREE.Vector3().fromArray(element.startPoint.split(',').map(Number));
                    var endPoint = new THREE.Vector3().fromArray(element.endPoint.split(',').map(Number));
                    var parentHandle = element.parentHandle;
                    generateLine(parentHandle,startPoint,endPoint,matrix,color);

                    break;
                case "DxfLwPolyline":
                    var pointArray = [];
                    var closed = element.closed == "False" ? false : true;
                    element.vertices.forEach(function(vector){
                        pointArray.push(new THREE.Vector3().fromArray(vector.split(',').map(Number)));
                    })
                    var parentHandle = element.parentHandle;

                    generatePolyLine(parentHandle,pointArray,closed,color,matrix);
                    

                    break;
                case "DxfCircle":
                    var center = new THREE.Vector3().fromArray(element.center.split(',').map(Number));
                    var radius = element.radius;
                    var startAngle = 2 * Math.PI;
                    var endAngle = 0;
                    var parentHandle = element.parentHandle;

                    generateCurve(parentHandle,element.type,center.x,center.y,radius,radius,startAngle,endAngle,color,matrix);
                    
                
                    break;
                case "DxfArc":
                       
                    var center = new THREE.Vector3().fromArray(element.center.split(',').map(Number));
                    var radius = element.radius;
                    var startAngle = element.startAngle;
                    var endAngle = element.endAngle;
                    var parentHandle = element.parentHandle;

                    generateCurve(parentHandle,element.type,center.x,center.y,radius,radius,startAngle,endAngle,color,matrix);
                
                    break;
                case "DxfEllipse":
                        
                    var center = new THREE.Vector3().fromArray(element.center.split(',').map(Number));
                    var xRadius = new THREE.Vector3().fromArray(element.majorAxisEndPoint.split(',').map(Number));
                    var yRadius = new THREE.Vector3().fromArray(element.minorAxisEndPoint.split(',').map(Number));
                    var startAngle = element.startParameter;
                    var endAngle = element.endParameter;
                    var parentHandle = element.parentHandle;

                    generateCurve(parentHandle,element.type,center.x,center.y,yRadius.x,xRadius.y,startAngle,endAngle,color,matrix);
                    
                
                    break;
                case "DxfSpline":
                    var fitPointArray = [];
                    element.fitPoints.forEach(function(fitPoint){
                        fitPointArray.push(new THREE.Vector3().fromArray(fitPoint.split(',').map(Number)));
                    })
                    var parentHandle = element.parentHandle;

                    generateSpline(parentHandle,fitPointArray,color,matrix);

                    break;
                case "DxfMText":
                    var context = element.simplifiedText;
                    var size = element.size;
                    var fontStyle = element.fontStyle;
                    var boxWidth = element.boxWidth;
                    var boxHeight = element.boxHeight;
                    var attachmentPoint = element.attachmentPoint;
                    var parentHandle = element.parentHandle;

                    generateText(parentHandle,context,size,color,matrix,fontStyle,boxWidth,boxHeight,null,attachmentPoint);
    
                    break;
                case "DxfText":
                    var context = element.simplifiedText;
                    var size = element.size;
                    var fontStyle = element.fontStyle;
                    var alignMentPoint1 = new THREE.Vector3().fromArray(element.alignMentPoint1.split(',').map(Number));
                    var parentHandle = element.parentHandle;
                   
                    generateText(parentHandle,context,size,color,matrix,fontStyle,null,null,alignMentPoint1,null,element.rotationAngle);

                    break;
                case "DxfInsert":
                    var insertPoint = new THREE.Vector3().fromArray(element.insertPoint.split(',').map(Number))
                    var rotationAngle = element.rotationAngle;
                    var parentHandle = element.parentHandle;
                    var insertName = element.insertName;
                    var nowHandle = element.nowHandle;
                    var insertScale = new THREE.Vector3().fromArray(element.insertScale.split(',').map(Number))
                    blockInf.push(
                        {
                            parentHandle:parentHandle,
                            insertPoint:insertPoint,
                            rotationAngle:rotationAngle,
                            insertName:insertName,
                            nowHandle:nowHandle,
                            nextParentHandle:parentHandle,
                            insertScale:insertScale,
                        }
                    )
                    break;
                default:
                    console.log('not exist'+element.type);
                break;      


            }

        })



    }




    function initRenderer(){
        scene = new THREE.Scene();
        
        webglRender = new THREE.WebGLRenderer( {antialias: true, alpha: true} ); // antialias 抗锯齿
        webglRender.setSize(window.innerWidth, window.innerHeight);
        webglRender.setClearColor(0x212830, 1.0);
        webglRender.shadowMap.enabled = true; // 允许阴影投射
        render = webglRender;
        
        
        document.getElementById('webgl-output').appendChild(render.domElement);
        window.addEventListener('resize', onWindowResize, false);

    }

    function initCamera(){

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 30, 100000); // 2147483647
        camera.position.set(8000,4000,50000);
        var target = new THREE.Vector3(8000,4000,0);
        
        controls = new OrbitControls(camera, render.domElement);
        controls.target = target;
        camera.lookAt(target);
    }


    function initAxis(){
        var X_geometry = new THREE.Geometry();
        X_geometry.vertices.push(new THREE.Vector3(0,0,0));
        X_geometry.vertices.push(new THREE.Vector3(1000000*2,0,0));
        var X = new THREE.Line(X_geometry, new THREE.LineBasicMaterial({color: 0xff0000}));
        X.position.set(-9000,-10000,0);
    
    
        var X1_geometry = new THREE.Geometry();
        X1_geometry.vertices.push(new THREE.Vector3(0,0,0));
        X1_geometry.vertices.push(new THREE.Vector3(1000,0,0));
        var X1 = new THREE.Line(X1_geometry, new THREE.LineBasicMaterial({color: 0x9400D3}));
        X1.position.set(-10000,-10000,0);
    
    
        var Y_geometry = new THREE.Geometry();
        Y_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        Y_geometry.vertices.push(new THREE.Vector3(0, 1000000*2, 0));
        var Y = new THREE.Line(Y_geometry, new THREE.LineBasicMaterial({color: 0x00ff00}));
        Y.position.set(-10000,-9000,0);
    
        var Y1_geometry = new THREE.Geometry();
        Y1_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        Y1_geometry.vertices.push(new THREE.Vector3(0, 1000, 0));
        var Y1 = new THREE.Line(Y1_geometry, new THREE.LineBasicMaterial({color: 0x9400D3}));
        Y1.position.set(-10000,-10000,0);
    
    
        var Z_geometry = new THREE.Geometry();
        Z_geometry.vertices.push(new THREE.Vector3(0,0,0));
        Z_geometry.vertices.push(new THREE.Vector3(0,0,1000000*2));
        var Z = new THREE.Line(Z_geometry, new THREE.LineBasicMaterial({color: 0x0000ff}));
        Z.position.set(-10000,-10000,1000);
    
    
        var Z1_geometry = new THREE.Geometry();
        Z1_geometry.vertices.push(new THREE.Vector3(0,0,0));
        Z1_geometry.vertices.push(new THREE.Vector3(0,0,1000));
        var Z1 = new THREE.Line(Z1_geometry, new THREE.LineBasicMaterial({color: 0x9400D3}));
        Z1.position.set(-10000,-10000,0);
    
    
        scene.add(X,Y,Z,X1,Y1,Z1);
    } 


    //SSSSSSSSSSSSSSSS
    /** 渲染场景 */
    function renderScene() {
        stats.update();
        //rotateMesh(); // 旋转物体
        requestAnimationFrame(renderScene);
        render.render(scene, camera);
    }
    
    /** 初始化 stats 统计对象 */
    function initStats() {
        stats = new Stats();
        stats.setMode(0); // 0 为监测 FPS；1 为监测渲染时间
        document.getElementById('stats-output').append(stats.domElement);
        return stats;
    }


    
    /** 当浏览器窗口大小变化时触发 */
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        render.setSize(window.innerWidth, window.innerHeight);
    }
    

    function calHandle(mesh,pHandle){
       
   


        blockInf.forEach(function(element){
            if(element.nowHandle == pHandle){
                //console.log(new THREE.Matrix4().setPosition(element.insertPoint))
                mesh.applyMatrix(new THREE.Matrix4().setPosition(element.insertPoint));
                mesh.rotateZ(element.rotationAngle);
                mesh.applyMatrix(new THREE.Matrix4().scale(element.insertScale));
                pHandle = element.parentHandle;
                calHandle(mesh,pHandle);
                
            }
        }) 


 
     }
    
    //生成线
    function generateLine(parentHandle,startPoint,endPoint,matrix,color){
        var material=new THREE.LineBasicMaterial({color:color})
        var geometry = new THREE.Geometry();
    
        geometry.vertices.push(startPoint);
        geometry.vertices.push(endPoint);
        
        var line = new THREE.Line( geometry, material );
        //line.position.set(0,0,0)
        
        line.applyMatrix(matrix);
        scene.add(line);

          calHandle(line,parentHandle);
    }
    
    
    
    
    //生成多段线
    function generatePolyLine(parentHandle,polyLineArray,closed,color,matrix){
        var points3D = new THREE.Geometry();
        
        for(var i=0;i<polyLineArray.length;i++){
            polyLineArray[i].setZ(0) ;
            points3D.vertices.push( 
                polyLineArray[i]
            );
        }

        if(closed == true){
            points3D.vertices.push( polyLineArray[0]);
        }
        
        var line2 = new THREE.Line(points3D, new THREE.LineBasicMaterial({color: color}));
        line2.applyMatrix(matrix);
        scene.add(line2);
        calHandle(line2,parentHandle);
    }
    
    
    
    
    //生成圆、椭圆
    function generateCurve(parentHandle,type,xPoint,yPoint,xRadius,yRadius,startAngle,endAngle,color,matrix){
       var point1 = startAngle < endAngle ? startAngle : endAngle;
       var point2 = startAngle > endAngle ? startAngle : endAngle;
       var clockWise = (type == "DxfEllipse") ? false : true;
        

  

        var curve = new THREE.EllipseCurve(
            xPoint,  yPoint,            // aX, aY
            xRadius, yRadius,           // xRadius, yRadius
            point1  , point2,  // aStartAngle, aEndAngle
            clockWise,            // aClockwise
            0                 // aRotation
        );
        
        var points = curve.getPoints( 50 );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        var material = new THREE.LineBasicMaterial( { color : color } );
        
        // Create the final object to add to the scene
        var mesh = new THREE.Line( geometry, material );
    
        mesh.applyMatrix(matrix);
        scene.add(mesh)
        
        calHandle(mesh,parentHandle);
    
    }
    
  
    
    
    //生成样条曲线
    function generateSpline(parentHandle,fitPointArray,color,matrix){
        var curve = new THREE.SplineCurve(fitPointArray);
        
        var points = curve.getPoints( 50 );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        var material = new THREE.LineBasicMaterial( { color : color } );
        
        // Create the final object to add to the scene
        var mesh = new THREE.Line( geometry, material );

        mesh.applyMatrix(matrix);
        scene.add(mesh);
        calHandle(mesh,parentHandle);

    }
    
 
    
    function selectFont(fontStyle){
        switch(fontStyle){
            case "宋体":
                return fontTTF.simsun;

            case "黑体":
                return fontTTF.heiti;

            default:
                console.log('没有指示字体，默认为宋体'); 
                return fontTTF.simsun;   

        }
    }
    
    
    //生成文字
    function generateText(parentHandle,context,size,color,matrix,fontStyle,boxWidth,boxHeight,alignMentPoint1,attachmentPoint,rotationAngle){
    
        //TTF读取方法

        var material = new THREE.MeshBasicMaterial( {color: color});
    
        var font;   

        font = selectFont(fontStyle);
        
        var shapes = font.generateShapes( context, size );
        var geometry = new THREE.ShapeBufferGeometry( shapes );
   
        var mesh = new THREE.Mesh( geometry, material );
        


        if(alignMentPoint1){

            mesh.position.copy(alignMentPoint1);
            mesh.rotateZ(rotationAngle);
        }else{

            mesh.applyMatrix(matrix);
        
            /*if(context == '图 纸 目 录'){
                translateMesh(attachmentPoint,mesh,-size*6,-size);
            }*/
    
           //translateMesh(attachmentPoint,mesh,-size*6,-size);
           translateMesh(attachmentPoint,mesh,-boxWidth,-boxHeight/2);


        }


        scene.add( mesh ); 
        calHandle(mesh,parentHandle);


        //JSON读取方法
       
  /*    var material = new THREE.MeshBasicMaterial({color: color});

        var shapes = new THREE.Font(FontDataJSON).generateShapes( context, size );
        var geometry = new THREE.ShapeBufferGeometry( shapes );
   
        var mesh = new THREE.Mesh( geometry, material );
        
        mesh.applyMatrix(matrix)
        scene.add( mesh );
  
     */
    }


    function translateMesh(attachmentPoint,mesh,width,height){
        switch(attachmentPoint){
            case 'TopCenter':
                //上中
                mesh.translateX(width/2);
                mesh.translateY(height);
                break;
            case 'TopRight':
                //上右
                mesh.translateX(width);
                mesh.translateY(height);
                break;

            case 'MiddleLeft':
                //左中
                mesh.translateY(height/2);
                break;

            case 'MiddleCenter':	
                //正中
                mesh.translateX(width/2);
                mesh.translateY(height/2);
                break;

            case 'MiddleRight':	
                //右中
                mesh.translateX(width);
                mesh.translateY(height/2);
                break;

            case 'BottomLeft':
                //下左
                
                break;

            case 'BottomCenter':	
                //下中
                mesh.translateX(width/2);
                break;

            case 'BottomRight':
                //右下
                mesh.translateX(width);
                break;

           }
    }
    
    
    
  

    function calColor(colorIndex){
       
        if(colorIndex >0 && colorIndex<255){
            var color = new THREE.Color(colorsMapper.getByACI(colorIndex).rgb).getHex ();
            
            return color;
        }else if(colorIndex == 0){

            return 0xFFFFFF;
        }else{
            
            return colorIndex;
        }
        
    }
    
    
    
    
    
    
    
    
    
    
    
    



}
module.exports = showCadJson;
var core = function () {
    var moduleData = {};
    var startedModules=[];
    return {
        register: function(moduleId, creator) {
            moduleData[moduleId] = {
                creator: creator,
                instance: null
            };
        },
        init: function(stage,path) {
        	var stage = stage || '';
        	if (stage === 'raw'){
        		sandbox.basePath = path;
        	}
            this.start('loader',stage);
        },

        start: function(moduleId,stage) {
            var f = true;
            for(var i in startedModules){
                if (startedModules[i] === moduleId){
                    f=false;break;
                }
            }
            if (f){
                moduleData[moduleId].instance = moduleData[moduleId].creator(sandbox,this);
                moduleData[moduleId].instance.init(stage);
                startedModules.push(moduleId);
            }
            return f;//f=false - module was already started and ready to receive messages
        },
        startAll: function() {
            for (var moduleId in moduleData) {
                if (moduleData.hasOwnProperty(moduleId)) {
                    this.start(moduleId);
                }
            }
        },

        startModules: function(modules,stage) {
            for (var moduleId in moduleData) {
                if (moduleData.hasOwnProperty(moduleId)) {
                    for(var i in modules){
                        if (modules[i] === moduleId){
                            this.start(moduleId,stage);
                        }
                    }
                }
            }
        }
    };
}();

var sandbox = function() {
    var moduleHandleList = [];
    var moduleHandle = {};

    return {
        listen: function(e, handle) {
            moduleHandle = {
                e:e,
                handle: handle
            };
            moduleHandleList.push(moduleHandle);
        },
        notify: function(message) {
            for (var i = 0; i < moduleHandleList.length; i += 1) {
                for (var j = 0; j < moduleHandleList[i].e.length; j += 1) {
                    if (moduleHandleList[i].e[j] === message.type) {
                        moduleHandleList[i].handle(message);
                    }
                }
            }
        },
        request:function(req, data, callback) {
            var tH = {
                start: function(id, args) {
                },
                complete: function(id, o, args) {
                },
                success: function(id, o, args) {
                    callback.success(o.responseText);
                },
                failure: function(id, o, args) {
                    callback.failure('ERROR');
                },
                end: function(id, args) {
                }
            };
            data = data.replace(/\&nbsp;+/,'');
            var cfg = {
                method: 'POST',
                on: {
                    start: tH.start,
                    complete: tH.complete,
                    success: tH.success,
                    failure: tH.failure,
                    end: tH.end
                },
                data: "req="+req +data,
                context: tH,
                headers: { 'X-Transaction': 'POST'}
            };

            var uri = "main/tasks";
            YUI().use("io", function(Y) {
                Y.io(uri, cfg);
            });
        },

        commonFunctions:function() {
            return {
                parseCurTimeCookie:function(curTimeC) {
                    var curTime = curTimeC.split('-');
                    var minTimerThen = Number( curTime[0] );
                    var secTimerThen = Number(curTime[1]);
                    var timeThen = Number(curTime[2]); //in seconds from 1970
                    var timeNow = Date.parse( new Date()) /1000;
                    var timeLeft =  (minTimerThen*60+secTimerThen) - (timeNow - timeThen);
                    var e = curTime[3];
                    return {time:timeLeft,event:e};
                }
            };
        }(),
        basePath: 'http://time-to-work.net/public/'
    };
}();

core.register("loader", function(sandbox,core) {
    return {
        init: function(stage) {
        	
            core.startModules(['layout','taskboard','curtaskboard'],stage);
            var curEvents=[];
            function NotifyAtOnce(message){
                var type = message.type +'*';// * - preventing infinit loop of loader
                sandbox.notify({
                    type: type,
                    data: message.data
                })
            };
            var config = {
                'arctaskboard':['taskboard:showArctaskboard'],
                'timer':['taskboard:taskStart','layout:breakStart'],
                'texteditor':['curtaskboard:addNote','curtaskboard:editNote']
            }
            function GetModuleName(messageType){
                for(var moduleName in config){
                    for(var i in config[moduleName]){
                        if (config[moduleName][i] === messageType){
                            return moduleName;
                        }
                    }
                }
            }
            var handleNotification = function(message) {
                var f = true;//if f = true we need to wait for stage 'loaded'

                var n = message.type.split(':').length;
                if (n===2){// as "taskboard:taskCurrent"
                    var moduleName = GetModuleName(message.type);
                    curEvents.push({'moduleName':moduleName,'message':message});
                    f = core.start(moduleName,stage);//answer is whether module loaded or not
                    if (!f){
                        NotifyAtOnce(message);
                        curEvents.pop();
                    }
                }
                else{  //as "curtaskboard-loaded"
                    var moduleName = message.type.split('-')[0];
                    for(var i in curEvents){
                        if(curEvents[i].moduleName === moduleName){
                            var type = curEvents[i].message.type +'*';
                            sandbox.notify({
                                type: type,
                                data: curEvents[i].message.data
                            })
                            curEvents.splice(i,1);
                        }
                    }
                }
            };
            sandbox.listen([
                'taskboard:taskStart',
                'layout:breakStart',
                'taskboard:showArctaskboard',

                'curtaskboard:addNote',
                'curtaskboard:editNote',

                "curtaskboard-loaded",
                'arctaskboard-loaded',
                'timer-loaded',
                'texteditor-loaded'
            ], handleNotification);
        }
    };
});

core.register("layout", function(sandbox) {
    return {
        init: function() {

            YUI().use('yui2-layout', 'yui2-resize', 'event','cookie','node', function (Y) {

                Y.on("domready", function() {
                    var YAHOO = Y.YUI2;

                    var layout = new YAHOO.widget.Layout({
                        minWidth: 1000,
                        minHeight: 500,
                        units: [
                            { position: 'top', body: 'top', height: 28, scroll: null, zIndex: 2 },
                            { position: 'right', body: 'sidebar', width: 700, resize:true,scroll: true, minWidth: 500, maxWidth: 700 },
                            { position: 'center', body: 'centerbar', width: 700, resize:true, scroll: true,minWidth: 500, maxWidth: 700 }
                        ]
                    });
                    layout.render();
                    Y.on("click", function(){location = sandbox.basePath + "../";}, Y.one("#bAboutProject"));
                    Y.on("click", function(){location = sandbox.basePath + "../auth/logout";}, Y.one("#bLogout"));

                    function SetInitialTaskboardState(){
                        Y.one('#taskboard').removeClass('hidden');
                     };

                    var fLoadArc = true;
                    Y.on("click", function(){
                        var node=Y.one('#arctaskboard');
                        var txt;
                        node.hasClass('hidden')?txt ='Скрыть блок Архив':txt = 'Показать блок Архив';
                        node.toggleClass('hidden');
                        Y.one("#bShowHideArchiveBlock a").set("innerHTML",txt);
                        if (fLoadArc){
                            fLoadArc = false;
                            sandbox.notify({
                                type: 'taskboard:showArctaskboard',
                                data: null
                            });
                        }
                    }, "#bShowHideArchiveBlock");

                    function SetInitialTimerState(){
                        var curTimeC = Y.Cookie.get("curTime");
                        if( curTimeC !== null){
                            var cookieData =sandbox.commonFunctions.parseCurTimeCookie(curTimeC);
                            if (cookieData.time >0 && cookieData.event !=='work'){
                                sandbox.notify({
                                    type:'layout:breakStart',
                                    data: cookieData
                                });
                            }
                            else{
                                Y.Cookie.remove("curTime");
                            }
                        }
                    }

                    var handleNotification = function(message) {
                        switch (message.type) {
                            case "taskboard:loaded":
                                SetInitialTaskboardState();
                                SetInitialTimerState();
                                break;
                        }
                    };
                    sandbox.listen([
                        "taskboard:loaded"

                    ], handleNotification);

                });

            });
        }
    };
});

core.register("taskboard", function(sandbox) {
    return {
        init: function(stage) {
        	
            YUI({
            	filter: stage,
            	combine:true,
                modules: {
                    "taskboard": {
                        fullpath: sandbox.basePath +'js/main/taskboard-min.js',
                        requires: ['widget', 'widget-parent', 'widget-child','event-custom','event-key','json','cookie','dump','anim']
                    },
                    taskboardcss: {
                        fullpath: sandbox.basePath +'css/main/taskboard.css',
                        type: 'css'
                    }
                }
            }).use('taskboard','taskboardcss',"event-synthetic", function (Y) {
                // Create a DOM event named "clickoutside"
                Y.Event.define("clickoutside", {
                    on: function (node, subscription, notifier) {

                        function outside(clickTarget) {
                            return clickTarget !== node && !clickTarget.ancestor(
                                    function (parent) {
                                        return parent === node;
                                    });
                        }
                        var handle = Y.one('doc').on('click', function (e) {
                            if (outside(e.target)) {
                                notifier.fire(e);
                            }
                        });
                        subscription.clickHandle = handle;
                    },
                    detach: function (node, subscription, notifier) {
                        subscription.clickHandle.detach();
                    }
                });

                Y.on("domready", function() {

                    var taskBoard = new Y.TaskBoard({
                        sandbox:sandbox
                    });
                    taskBoard.render("#taskboardbody");

                    function loadTasks() {
                        sandbox.request('load-tasks-to-taskboard', '', {
                            success: function(response) {
                                taskBoard.onLoad(response);
                                taskBoard.notifySandbox( "taskboard:loaded");
                                Y.one('#loadingMaskBlock').setStyle("display", "none");
                            },
                            failure: function(response) {
                            }
                        });
                    };
                    loadTasks();

                    var handleNotification = function(message) {
                        switch (message.type) {
                            case "curtaskboard:modifyNote":
                                taskBoard.modifyTaskNotes(message);
                                break;
                            case 'arctaskboard:restoreProject':
                                taskBoard.restoreProject(message.data);
                                break;
                            case 'timer-loaded':
                                var now = new Date()/1000;
                                var data = taskBoard.getDataForTimer(now);
                                taskBoard.notifySandbox('taskboard:recentPomsDone',data);
                                break;
                            case 'timer:stopWork':
                                taskBoard.stopWork(message.data);
                                break;
                        }
                    };
                    sandbox.listen([
                        "curtaskboard:modifyNote",
                        'arctaskboard:restoreProject',
                        'timer-loaded',
                        'timer:stopWork'
                    ], handleNotification);
                });// "domready",function()
            });// function (Y)
        }//init: function()
    };//return
});//function(sandbox)

core.register("curtaskboard", function(sandbox) {
    return {
        init: function(stage) {

            YUI({
            	filter: stage,
            	combine:true,
                modules: {
                    "curtaskboard":{
                        fullpath:sandbox.basePath +"js/main/curtaskboard-min.js",
                        requires: ['widget', 'widget-parent', 'widget-child','event-custom','json-stringify','dump']
                    },
                    curtaskboardcss: {
                        fullpath: sandbox.basePath +"css/main/curtaskboard.css",
                        type: 'css'
                    }
                }
            }).use('curtaskboard', 'curtaskboardcss', function (Y) {

                Y.on("domready", function() {
                    var curTask = new Y.CurTaskBoard({
                        sandbox: sandbox
                    });
                    curTask.render("#curtaskbody");

                    var handleNotification = function(message) {
                        switch (message.type) {

                            case "taskboard:taskCurrent":
                                curTask.showContent(message.data);
                                break;

                            case "task:addSubTask":
                                curTask.removeContent(message.data);
                                break;

                            case "taskboard:projectMoveToArchive":
                            case 'taskboard:taskDone':
                            case "taskboard:delTask":
                                curTask.removeByRef(message.data);
                                break;
                            case "task:editName":
                                curTask.changeName(message.data);
                                break;

                            case "texteditor:newNoteSave":
                                curTask.saveNewNote(message.data);
                                break;
                            case "texteditor:existingNoteSave":
                                curTask.changeNote(message.data);
                                break;
                        }
                    };
                    sandbox.listen([
                        "taskboard:taskCurrent",
                        "taskboard:delTask",
                        "task:editName",
                        "texteditor:newNoteSave",
                        "texteditor:existingNoteSave",
                        "taskboard:projectMoveToArchive",
                        'taskboard:taskDone'
                    ], handleNotification);

                    curTask.notifySandbox('curtaskboard-loaded');
                });
            });//use - function(Y)
        }//init:function()
    };//return
});//function(sandbox)

core.register("arctaskboard", function(sandbox) {
    return {
        init: function(stage) {
            YUI({
            	filter: stage,
            	combine:true,
                modules: {
                    arctaskboard:{
                        fullpath: sandbox.basePath +"js/main/arctaskboard-min.js",
                        requires: ['widget', 'widget-parent', 'widget-child','event-custom','event-key','json-stringify','dump']
                    },

                    arctaskboardcss: {
                        fullpath: sandbox.basePath +"css/main/arctaskboard.css",
                        type: 'css'
                    }
                }
            }).use('arctaskboard','arctaskboardcss', function (Y) {

                Y.on("domready", function() {

                    var arcTaskBoard = new Y.ArcTaskBoard({
                        sandbox:sandbox
                    });
                    arcTaskBoard.render("#arctaskboardbody");

                    var init = true;//flag for initialisation
                    function loadArctasks() {
                        if (init){
                            init = false;
                            sandbox.request('load-tasks-to-arctaskboard', '', {
                                success: function(response) {

                                    arcTaskBoard.onLoad(response);
                                    Y.one("#arctaskboard").removeClass('hidden');
                                },
                                failure: function(response) {
                                }
                            });
                        }
                    };

                    var handleNotification = function(message) {
                        switch (message.type) {
                            case "taskboard:projectMoveToArchive":
                                arcTaskBoard.addArcProject(message.data);
                                break;
                            case 'taskboard:showArctaskboard*':
                                loadArctasks();
                                break;
                        }
                    };
                    sandbox.listen([
                        'taskboard:projectMoveToArchive',
                        'taskboard:showArctaskboard*'
                    ], handleNotification);
                    arcTaskBoard.notifySandbox('arctaskboard-loaded');

                });
            });//use - function(Y)
        }//init:function()
    };//return
});//function(sandbox)

core.register("texteditor", function(sandbox) {
    return {
        init: function(stage) {

            YUI({
            	filter: stage,
            	combine:true,
                modules: {
                    texteditor:{
                        fullpath: sandbox.basePath +"js/main/texteditor-min.js",
                        requires: ["widget","overlay","editor","event-key"]
                    },
                    overlaycss:{
                        fullpath: sandbox.basePath +"css/main/overlay.css",
                        type: 'css'
                    }
                }
            }).use('texteditor', 'overlaycss', function (Y) {

                var textEditor = new Y.WJ.TextEditor({
                    sandbox:sandbox
                });
                textEditor.render();

                var handleNotification = function(message) {
                    switch (message.type) {
                        case 'curtaskboard:addNote*':
                        case 'curtaskboard:editNote*':
                            textEditor.showNoteEditor(message);
                            break;
                    }
                };
                sandbox.listen([
                    'curtaskboard:addNote*',
                    'curtaskboard:editNote*'

                ], handleNotification);

                sandbox.notify({
                    type: 'texteditor-loaded'
                });

            });//use - function(Y)
        }//init:function()
    };//return
});//function(sandbox)

core.register("timer", function(sandbox) {
    return {
        init: function(stage) {
            YUI({
            	filter: stage,
            	combine:true,
                gallery: 'gallery-2011.02.09-21-32',
                modules: {

                    timer:{
                        fullpath: sandbox.basePath +"js/main/timer-min.js",
                        requires: ["widget","cookie",'datatype-date','json-parse']
                    },

                    timercss: {
                        fullpath: sandbox.basePath +"css/main/timer.css",
                        type: 'css'
                    },
                    soundmanager: {
                        fullpath: sandbox.basePath +"js/libs/soundmanager2-nodebug-jsmin.js",
                        type: 'js'
                    }
                },
                skin: {
                    overrides: {
                        slider: [
                            'round'
                        ]
                    }
                }
            }).use('timer', 'timercss','soundmanager','gallery-progress-bar', 'slider', function (Y) {

                Y.on("domready", function() {

                    soundManager.url = '../public/swf/';
                    soundManager.flashVersion = 9;
                    soundManager.useFlashBlock = false;

                    var timer = new Y.WJ.Timer({
                        soundManager:soundManager,
                        sandbox:sandbox
                    });
                    timer.render('#timerbody');

                    var tpb = new Y.ProgressBar({
                        render: '#timerProgressBar',
                        layout : '<div class="{sliderClass}"></div>'
                    });
                    timer.set('tpb',tpb);

                    var vol= Y.Cookie.get("soundVolume");
                    if (vol === null){
                        vol = 2000;
                        Y.Cookie.set("soundVolume",vol);
                    }
                    var slider = new Y.Slider({
                        axis        : 'x',
                        min         : 0,
                        max         : 4000,
                        value       : vol,
                        length: '300px'
                    });
                    slider.render("#soundSliderBody");
                    timer.set('slider',slider);

                    Y.on("click", function(){
                        Y.one("#soundAdjustBlock").setStyle("display", "block");
                    }, "#bChangeSoundVolume");
                    Y.on("click", function(){
                        Y.one("#soundAdjustBlock").setStyle("display", "none");

                    }, "#soundAdjustBlockCloser");
                    Y.on("click", function(){
                        Y.one("#startBreakBlock").setStyle("display", "none");
                    }, "#startBreakBlockCloser");

                    Y.on("click", function(){
                        if (Y.Cookie.get('curTime') === null){
                            var node=Y.one('#timerboard');
                            node.addClass('hidden');
                        }
                    }, "#bHideTimerBlock");

                    Y.on("click",timer.playSound, "#bPlaySound",timer);
                    Y.on("click", timer.startBreak, "#bBreak3",timer,3);
                    Y.on("click", timer.startBreak, "#bMenuBreak3",timer,3);
                    Y.on("click", timer.startBreak, "#bBreak5",timer,5);
                    Y.on("click", timer.startBreak, "#bMenuBreak5",timer,5);
                    Y.on("click", timer.startBreak, "#bBreak15",timer,15);
                    Y.on("click", timer.startBreak, "#bMenuBreak15",timer,15);
                    Y.on("click", timer.startBreak, "#bBreak20",timer,20);
                    Y.on("click", timer.startBreak, "#bMenuBreak20",timer,20);

                    var handleNotification = function(message) {

                        switch (message.type) {
                            case 'taskboard:taskStart*':
                                Y.one('#timerboard').removeClass('hidden');
                                timer.startWork(message.data);
                                break;
                            case 'layout:breakStart*':
                                Y.one('#timerboard').removeClass('hidden');
                                timer.startBreak(message.data);
                                break;
                            case "task:editName":
                                timer.changeCurTaskName(message.data);
                                break;
                            case 'taskboard:recentPomsDone'://this message will come after taskboard got message 'timer-loaded'
                                timer.setPomsDone(message.data);
                                break;
                        }
                    };
                    sandbox.listen([
                        'taskboard:recentPomsDone', //taskboard send data in this message after timer sent message 'timer-loaded'
                        'taskboard:taskStart*',
                        'layout:breakStart*',
                        "task:editName"
                    ], handleNotification);

                    timer.notifySandbox('timer-loaded');
                });

            });//use - function(Y)
        }//init:function()
    };//return
});//function(sandbox)




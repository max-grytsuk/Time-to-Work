YUI.add("timer", function(Y) {

    function Timer(config) {
        Timer.superclass.constructor.apply(this, arguments);
    }

    Timer.NAME = "timer";

    Timer.ATTRS = {
        tpb:{
            value: null
        },
        soundManager:{
            value: null
        },
        slider:{
            value: null
        },
        sandbox:{
            value: null
        },
        minutes:{
            value: 25
        },
        seconds:{
            value: 0
        },
        event:{
            value: null
        },
        state:  {
            value: null
        },
        curTaskId:{
            value: null
        },
        curTaskName:{
            value: null
        },
        pomsDone:{
            value: []
        },
        init:{
            value: true
        }
    };


    Y.extend(Timer, Y.Widget, {

        notifySandbox:function(type,data){

            this.get('sandbox').notify({
                type: type,
                data: data
            });
        },
        sendDataAjax:function(type,data,obj){

            this.get('sandbox').request(type,data, obj,{
                success: function(response){

                },
                failure: function(response){

                }
            });
        },
        _uiSetTimer:function(){
            var s = this.get('seconds');
            var m = this.get('minutes');

            var c = this.get('contentBox');
            s = s>9?s:'0'+s;
            m = m>9?m:'0'+m;
            c.one('#seconds').set('innerHTML',s);
            c.one('#minutes').set('innerHTML',m);
        },
        _afterTimeChange:function(){
            this._uiSetTimer();
        },
        decrement: function() {
            var m = this.get('minutes');
            var s = this.get('seconds');


            if (s > 0 && m >= 0){
                this.set('seconds',--s);
            }
            else if (s === 0 && m >0){
                this.set('seconds',59);
                this.set('minutes',--m);
            }
            else {
                this.set('state',null);
            }
            var now = Date.parse( new Date()) /1000;
            var e = this.get('event');

            Y.Cookie.set("curTime", m+'-'+s+'-'+now+'-'+e,{ expires: new Date("January 12, 2025") });
        },

        _uiSetName:function(){
            this.get('contentBox').one('#curTaskName').set('innerHTML',this.get('curTaskName'));
        },
        _afterCurTaskNameChange:function(e){
            this._uiSetName();
        },

        _onButtonStopClick:function (e){
            e.halt();
            this.set('state',null);

        },
        setPomsDone:function(data){
//            var obj = message.data;
            if (data !== null){
                this.set('pomsDone',data);
                var prev = data[0];    //first pomDone for last 8 hours
                var parentNode = this.get('contentBox').one('#timerWorkStages');
                for(var i in data){
                    if (data[i]-prev  > 2400){  //if time between two pomsDone more than 40min we set sign of big break
                        parentNode.appendChild(Y.Node.create('<li class="break-stage"></li>'));
                    }
                    parentNode.appendChild(Y.Node.create('<li class="working-stage"></li>'));
                    prev = data[i];
                }
            }
        },



        playSound:function (){
            var soundManager = this.get('soundManager');
            var slider = this.get('slider');
            soundManager.onready(function() {  //soundmanager defined on index page
                var mySound = soundManager.createSound({
                    id: 'someSound',
                    url: '../public/sound/gorn.mp3'
                });
                var vol =slider.getValue();
                Y.Cookie.set("soundVolume", vol,{ expires: new Date("January 12, 2025") });
                mySound.setVolume(vol);
                mySound.play();
            });
        },
        run:function (val){
            var state = this.get('state');
            var t =   this.get('minutes') + this.get('seconds');
            var tpb = this.get('tpb');
            if (state !== null){
                if (t >= 0){
                    Y.later(1000, this, function(e){
                        tpb.decrement(val);
                        this.decrement();//this function changes state of timer
                        this.run(val);
                    });
                }
            }
            else{
                tpb.set('progress',100);
                //timer went to finish
                if ( t === 0){
                    this.playSound();//sound played only after finish of work or break
                    if (this.get('event') === 'work'){//end of pomodoro
                        Y.one('#startBreakBlock').setStyle('display','block');

                        this.uiSetStage();

                        var now = Y.DataType.Date.format (  new Date() , {format:"%Y:%m:%d:%T "} );

                        var data = "&idTask=" + this.get('curTaskId') + "&finishTime=" + now;
                        this.sendDataAjax('pom-done', data );
                    }
                }
                this.notifySandbox('timer:stopWork',this.get('curTaskId'));
                tpb.set('progress',0);
                this.set('event',null);
                this.set('state',null);
                this.set('curTaskId',null);
                this.set('curTaskName','');
                Y.Cookie.remove("curTime");
                this.set('minutes',25);
                this.set('seconds',0);

                Y.one('#bMenuBreak3').setStyle('display','block');
                Y.one('#bMenuBreak5').setStyle('display','block');
                Y.one('#bMenuBreak15').setStyle('display','block');
                Y.one('#bMenuBreak20').setStyle('display','block');
            }
        },

        uiSetStage:function (){
            var secNow =Date.parse( new Date() ) /1000;
            var arr = this.get('pomsDone');
            var secLast = arr[arr.length-1];
            var node = Y.one('#timerWorkStages');
            if (secNow-secLast  > 2400){  //if time between two pomsDone more than 40(25+15)min we set sign of big break
                node.appendChild(Y.Node.create('<li class="break-stage"></li>'));
            }
            node.appendChild(Y.Node.create('<li class="working-stage"></li>'));
            arr.push(secNow);

        },
        changeCurTaskName:function (data) {

            if (!Y.Lang.isUndefined(data)) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].id === this.get('curTaskId')) {
                        this.set('curTaskName', data[i].name);
                        break;
                    }
                }
            }
        },

        initBeforRun:function (m,s,p,e){
            Y.one('#bMenuBreak3').setStyle('display','none');
            Y.one('#bMenuBreak5').setStyle('display','none');
             Y.one('#bMenuBreak15').setStyle('display','none');
             Y.one('#bMenuBreak20').setStyle('display','none');

            this.set('minutes',m);
            this.set('seconds',s);
            this.get('tpb').set('progress',p);
            this.set('event',e);
            this.set('state','run');
        },

        startWork:function (data){

            if (this.get('event') === null){

                this.set('curTaskId',data.idTask);
                this.set('curTaskName',data.taskName);

                var time = data.time;
                var m =Math.floor(time/60);
                var s =time%60;
                var p = time*100/1500;//in percents
                var e = 'work';
                this.initBeforRun(m,s,p,e);
                var step =100/1500;
                this.run(step);
            }
        },
        startBreak:function (data,m){

            if (this.get('event') === null){
                var p =100,v,e,s=0;
                if (!Y.Lang.isUndefined(m)){//from clickbutton
                    Y.one('#startBreakBlock').setStyle('display','none');
                    e = 'break'+m;
                    v = m;
                }

                else{//from event layout:breakStart after reloading
                    e = data.event;
                    if (e === 'break3') v = 3;
                    else if (e === 'break5') v = 5;
                    else if (e === 'break15') v = 15;
                    else if (e === 'break20') v = 20;
                    else if (e === 'break30') v = 30;
                    var t =data.time;
                    p = t*100/(v*60);//in percents

                    m =Math.floor(t/60);
                    s =t%60;
                }

                var step=100/(v*60);

                this.initBeforRun(m,s,p,e);
                this.run(step);
            }
        },
        renderUI : function() {
            var c = this.get("contentBox");
            var m = this.get('minutes');
            var s = this.get('seconds');

            s = s>9?s:'0'+s;
            m = m>9?m:'0'+m;

            var name = this.get('curTaskName')||'';
            c.setContent(

                    "<div id ='curTaskName' style='margin:10px' >"+name+
                            "</div>"+
                            "<div class='timer'>"+
                            "<span id='minutes' >"+m+"</span>"+
                            "<span >:</span>"+
                            "<span id='seconds'>"+s+"</span>"+
                            "</div>"+
                            "<div id='timerProgressBar' style='float:left'></div>"+

                            "<div style='padding-bottom:30px '>"+
                            "<input type='button' class='button-startstop-timer art-button-wrapper' id='bStop' value='- Stop -'>"+
                            "</div>"+

                            "<div class='cleared'></div>"+

                            "<ul id='timerWorkStages' style='padding:5px 70px'>" +
                            "</ul>"
                    );
        },

        bindUI : function() {
            var c = this.get('contentBox');
            Y.on("click", Y.bind(this._onButtonStopClick, this) , c.one("#bStop"));

            this.after("curTaskNameChange", this._afterCurTaskNameChange);
            this.after("secondsChange", this._afterTimeChange);
            this.after("minutesChange", this._afterTimeChange);
        },

        syncUI : function() {
        }

    });

    Y.namespace("WJ").Timer = Timer;

}, "3.1.0", {requires:["widget","cookie",'datatype-date','json-parse',"dump"]});


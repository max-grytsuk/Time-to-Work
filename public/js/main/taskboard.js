YUI.add("taskboard", function(Y) {


    Y.TaskBoard = Y.Base.create("taskboard", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {

        _afterChildAdded:function(e){
            e.child.set('parent',this);
            e.child.render(this.get("contentBox"));
        },

        notifySandbox:function(type,data){

            this.get('sandbox').notify({
                type: type,
                data: data
            });
        },

        sendDataAjax:function(type,data,obj){

            this.get('sandbox').request(type,data,{
                success: function(response){
                },
                failure: function(response){
                }
            });
        },

        onLoad:function (response) {
            this.removeAll();
            this.get("contentBox").all('#li').remove();
            var obj = Y.JSON.parse(response);

            for(var i in obj){
                var t = obj[i];
                var notes = t.notes;
                if (notes === "" || Y.Lang.isUndefined(notes))
                    notes = [];
                var state;
                var value = Y.Cookie.get("doneProjectsState");
                if (value === null && t.state === 'done-hidden')
                    state = 'done';
                else
                    state = t.state;

                var task = new Y.Task({
                    id:t.idTask,
                    name:t.name,
                    idParent:  t.idParent,
                    state: state,
                    pomsDone:t.pomsDone,
                    uiState: t.uiState,
                    notes:notes,
                    sandbox: sandbox,
                    taskBoard:this
                });

                if (t.idParent === 'NULL') {
                    this.add(task); // rendering of task in eventHandler taskboard_afterChildAdded

                }
                else {
                    var node = Y.one('#' + t.idParent);
                    var p = Y.Widget.getByNode(node);
                    if (p !== null)
                        p.add(task);// rendering of task in eventHandler task_afterChildAdded
                }
                var fullName = task.GetFullName(task, t.name);
                var data;
                if (t.state === 'current' || t.state === 'started') {
                    this.set('curTaskId', t.idTask);
                    data = {idTask:t.idTask,taskName:fullName,taskNotes:notes};
                    this.notifySandbox("taskboard:taskCurrent", data);

                    if (t.state === 'started'){
                        var curTimeC = Y.Cookie.get("curTime");
                        var time =0;
                        if (curTimeC !==null){
                            var cookieData =sandbox.commonFunctions.parseCurTimeCookie(curTimeC);
                            time = cookieData.time;//time left for work
                        }

                        if (time  > 0){
                            this.set('startedTaskId', t.idTask);
                            data = {idTask:t.idTask,taskName:fullName,time:time};
                            this.notifySandbox("taskboard:taskStart",data);
                        }
                        else{
                            Y.Cookie.remove("curTime");
                            task.set('state','current');
                            var dataDB="&state=current&idTask=" + id;
                            this.sendDataAjax('change-state',dataDB, null);
                        }
                    }
                }
            }

            if (this.size() === 0){//when user come to app first time
                var name ='Первый проект';
                var task = new Y.Task({
                    name:name,
                    sandbox: sandbox,
                    taskBoard:this
                });
                this.add(task); // rendering of task in eventHandler taskboard_afterChildAdded
                task.set('state','current');
                var id = task.get('id');
                this.set('curTaskId', id);

                data = {idTask:id,taskName:name,taskNotes:[]};
                this.notifySandbox("taskboard:taskCurrent", data);

                var idParent = 'NULL';
                var jsonTask = Y.JSON.stringify({idTask:id, name:name,idParent:idParent});
                var data = "&task="+jsonTask;
                this.sendDataAjax('add-new-task',data, null);

                var dataDB="&state=current&idTask=" + id;
                this.sendDataAjax('change-state',dataDB, null);

            }
        },

        createNewProject:function () {
            //Check for enabled inputs
            var list = Y.all('#taskboardbody input.visible');
            if (list.size() === 0) {
                var task = new Y.Task({
                    sandbox: sandbox,
                    taskBoard:this
                });
                this.add(task);//rendering of task executed in eventhandler of afterChildAdded
            }
        },

        collapseExpandAllTasks:function (e) {
            e.halt();
            var node = Y.one("#bCollapseExpandAllTasks a");
            var txt = node.get("innerHTML");
            if (txt === 'Скрыть содержимое всех проектов') {

                this.each(function(task) {
                    task.set('uiState', 'collapsed');
                    var dataDB = "&state=collapsed&idTask=" + task.get('id');
                    this.sendDataAjax('change-state', dataDB, null);
                },this);
                node.set("innerHTML", "Показать содержимое всех проектов");
            }
            else {

                this.each(function(task) {
                    Y.bind(expandAllTasksRec, this,task)();//changing context object of function
                },this);

                node.set("innerHTML", "Скрыть содержимое всех проектов");
            }
            function expandAllTasksRec(task,taskboard) {
                task.set('uiState', 'expanded');

                var dataDB = "&state=expanded&idTask=" + task.get('id');
                this.sendDataAjax('change-state', dataDB, null);

                task.each(function(child) {
                    child.get('boundingBox').removeClass('hidden');
                    var s = child.size();
                    if (s > 0)
                        Y.bind(expandAllTasksRec, this,child)();
                },this);
            }
        },

        showHideDoneTasks:function () {

            var node = Y.one("#bShowHideDoneTasks a");
            var stateBefore =this.get("doneTasksState"),stateAfter;

            if (stateBefore === 'done') {
                stateAfter="done-hidden";
                node.set("innerHTML", "Показать все сделанные задачи");
            }
            else {
                stateAfter="done";
                node.set("innerHTML", "Скрыть все сделанные задачи");
            }
            this.set("doneTasksState", stateAfter);

            this.each(function(project) {
                if (project.get('initDoneTasks')){
                    project.loadDoneTasks();
                    project.set('initDoneTasks',false);
                }
                else{
                    project.toggleDoneTasksStateRec(stateAfter);
                }
            });
        },

        restoreProject:function (arcProject){

            var resProject =  Y.bind(createTask, this,arcProject,"")();//createTask(arcProject,"");
            this.add(resProject);
            Y.bind(setChildTasksRec, this,arcProject,resProject)();//SetChildTasks(arcProject,resProject);

            function createTask(arcTask, idParent){
                var id = arcTask.get('id');
                var name = arcTask.get('name');
                var notes = arcTask.get('notes');
                var pomsDone = arcTask.get('pomsDone');
                var state ;
                var value = Y.Cookie.get("doneProjectsState");
                if (idParent === '')
                    state = '';
                else if(value === 'done-hidden')
                    state = 'done-hidden';
                else
                    state = 'done'

                var resTask = new Y.Task({
                    id: id,
                    idParent:idParent,
                    name: name,
                    pomsDone:pomsDone,
                    notes: notes,
                    state: state,
                    sandbox:sandbox,
                    taskBoard:this
                });
                return resTask;
            }

            function setChildTasksRec(arcTask, resTask){
                var l = arcTask.size();
                for(var i=0;i<l;i++){
                    var arcChildTask = arcTask.item(i);
                    var idParent = resTask.get('id');
                    var resChildTask = Y.bind(createTask, this,arcChildTask, idParent)();//createTask(arcChildTask, idParent);
                    resTask.add(resChildTask);

                    var txt = Y.one("#bShowHideDoneTasks a").get("innerHTML");
                    if (txt === 'Показать сделанные задачи'){
                        resChildTask.get('boundingBox').addClass('hidden');
                    }

                    if (arcChildTask.size()>0) {
                        Y.bind(setChildTasksRec, this,arcChildTask,resChildTask)();//setChildTasksRec(arcChildTask,resChildTask);
                    }
                }
            }
        },
        _getRecentPomsDone:function  (poms,now){
            var arr = poms.split(',');
            var resArr=[];
            for (var i in arr){
                var date = arr[i].split(':'); //arr[i] - год:месяц:день:час:мин:сек
                var rDate = date[1]+'/'+date[2]+'/'+date[0] +' '+ date[3]+':'+ date[4]+':'+ date[5];// needed - месяц/день/год
                var sec = Date.parse(rDate)/1000;
                if (now - sec < 43200){ //43200 = 12h * 60min *60sec
                    resArr.push(sec);
                }
            }
            return resArr;
        },
        _getDataForTimerRec:function (task,arr,now){
            task.each(function(child){
                if (child.size()>0){
                    arr = this._getDataForTimerRec(child,arr,now);
                }
                else{
                    var poms = child.get('pomsDone');
                    if (poms !== null){
                        var recentPoms = this._getRecentPomsDone(poms,now);
                        arr =arr.concat(recentPoms);
                    }
                }
            },this)
            return arr;
        },
        getDataForTimer:function (now){
            var arr=[];

            this.each(function(task) {
                if (task.size()>0){
                    arr = this._getDataForTimerRec(task,arr,now);
                }
                else{
                    var poms = task.get('pomsDone');
                    if (poms !==null){
                        var recentPoms = this._getRecentPomsDone(poms,now);
                        arr =arr.concat(recentPoms);
                    }
                }
            },this);

            arr.sort( function (i, ii) {
                if (i > ii)
                    return 1;
                else if (i < ii)
                    return -1;
                else
                    return 0;
            });
            return arr;
        },

        modifyTaskNotes:function (message){
            var idTask = "#" + message.data.idTask;
            var task = Y.Widget.getByNode(idTask);
            if (task !== null) {
                task.set('notes', message.data.notes);
            }
        },

        startWork:function (){
            var curTaskId = this.get('curTaskId');
            var node = Y.one('#' + curTaskId);
            var task = Y.Widget.getByNode(node);
            if (task !== null){
                var fullName = task.GetFullName(task, task.get('name'));
                var data = {idTask:curTaskId,taskName:fullName};
                this.notifySandbox("taskboard:taskStart*",data);

                task.set('state','started');
                var dataDB="&state=started&idTask=" + curTaskId;
                this.sendDataAjax('change-state',dataDB, null);
            }
        },

        stopWork:function (id){
            var node = Y.one('#' + id);
            var task = Y.Widget.getByNode(node);
            var dataDB;
            if (task !== null){

                var curTaskId = this.get('curTaskId');
                if (curTaskId === id){
                    task.set('state','current');
                    dataDB="&state=current&idTask=" + id;
                }
                else{
                    task.set('state','');
                    dataDB="&state=&idTask=" + id;

                }
                this.sendDataAjax('change-state',dataDB, null);
                this.set('startedTaskId',null);
            }
        },



        CONTENT_TEMPLATE : "<ul></ul>",

        bindUI : function() {
            this.after('addChild', this._afterChildAdded);
            Y.on('click', Y.bind(this.createNewProject, this),"#bAddProject");
            Y.on("click", Y.bind(this.collapseExpandAllTasks,this), "#bCollapseExpandAllTasks");
            Y.on("click", Y.bind(this.showHideDoneTasks,this), "#bShowHideDoneTasks");
        }

    }, {

        ATTRS : {
            name:{
                value:'taskboard'
            },
            curTaskId:{
                value: null
            },
            startedTaskId:{
                value: null
            },
            doneTasksState:{
                value:"done-hidden"
            },
            sandbox: {
                value:null
            },
            setter: "_set"
            , getter: "_get"
        }
    });


    Y.Task = Y.Base.create("task", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {

        //Handlers for event 'mouseover' 'mouseout'
        _uiShowMenu:function(e){
            var c = this.get("contentBox");
            var f = c.one('input').hasClass('visible');
            if ( (this.get('uiState') !== 'collapsed' && !f) || this.get('state') === 'done'  ){
                var id = this.get('id');
                var menustr ='#taskmenu-'+id;
                c.one(menustr).removeClass('hidden');

                var movestr = '#tmmove-'+id;
                var move = c.one(movestr);

                var startstr = '#tmstart-'+id;
                var start = c.one(startstr);

                var resstr = '#tmrestore-'+id;
                var restore =c.one(resstr);
                var state = this.get('state');
                if (state === 'done'){
                    restore.removeClass('hidden');
                    move.addClass('hidden');
                    start.addClass('hidden');

                    var addstr = '#tmadd-'+id;
                    c.one(addstr).addClass('hidden');

                    var delstr = '#tmdel-'+id;
                    c.one(delstr).addClass('hidden');


                    var donestr = '#tmdone-'+id;
                    c.one(donestr).addClass('hidden');
                }
                else{
                    restore.addClass('hidden');

                    if (this.size()>0){
                        move.addClass('hidden');
                        start.addClass('hidden');
                    }
                    else if (state === 'current'){
                        move.addClass('hidden');
                    }
                    else{
                        move.removeClass('hidden');
                        start.removeClass('hidden');

                    }

                    var addstr = '#tmadd-'+id;
                    c.one(addstr).removeClass('hidden');

                    var delstr = '#tmdel-'+id;
                    c.one(delstr).removeClass('hidden');

                    var donestr = '#tmdone-'+id;
                    c.one(donestr).removeClass('hidden');
                }


            }
        },
        _uiHideMenu:function(e){
            if (this.get('uiState') !== 'collapsed' || this.get('state') === 'done'){
                var tmstr ='#taskmenu-'+this.get('id');
                this.get("contentBox").one(tmstr).addClass('hidden');
            }
        },

        _uiSetName:function(){
            this.get('contentBox').one('strong').set('innerHTML',this.get('name'));
        },

        //Changing skin of task during work
        _uiSetTaskSkin:function(e){
            var id = this.get('id');
            var c = this.get("contentBox");
            var b =this.get("boundingBox");
            var tnstr ='#taskname-'+id;
            var h = c.one(tnstr);

            var tmstr ='#taskmenu-'+id;
            var menu= c.one(tmstr);

            var i = c.one('input');
            var underline = c.one('.underline');

            if (this.size() > 0)
                h.addClass('parent');
            else
                h.removeClass('parent');
            var name = this.get('name');
            var state = this.get('state');
            switch(state){
                case "":
                    h.removeClass('done');
                    h.removeClass('current');
                    h.removeClass('started');
                    h.removeClass('hidden');
                    i.removeClass('visible');
                    underline.removeClass('hidden');
                    b.setStyle('display','');
                    b.removeClass('hidden');
                    break;
                case "editing":
                    h.addClass('hidden');
                    menu.addClass('hidden');
                    underline.addClass('hidden');
                    i.addClass('visible');
                    i.set('value',this.get('name'));
                    i.focus();
                    break;
                case "current":
                    h.addClass('current');
                    h.removeClass('started');
                    h.removeClass('hidden');
                    i.removeClass('visible');
                    underline.removeClass('hidden');
                    break;
                case "started":
                    h.addClass('started');
                    h.removeClass('hidden');
                    i.removeClass('visible');
                    underline.removeClass('hidden');
                    break;
                case "done":
                    h.addClass('done');
                    b.setStyle('display','block');
                    underline.removeClass('hidden');
                    h.removeClass('current');
                    h.removeClass('started');
                    break;
                case "done-hidden":
                    b.setStyle('display','none');
                    underline.addClass('hidden');
                    h.removeClass('done');
                    h.removeClass('current');
                    h.removeClass('started');
                    break;
            }


            var mmstr = "#minmax-" +id;
            var a = c.one(mmstr);
            var uiState = this.get('uiState');
            switch(uiState){
                case "expanded":
                    a.replaceClass('max','min');
                    a.setAttribute('title','minimize');
                    this.each(function(child) {
                        child.get('boundingBox').removeClass('hidden');
                    });
                    break;
                case "collapsed":
                    var tmstr = '#taskmenu-'+id;
                    c.one(tmstr).addClass('hidden');
                    a.replaceClass('min','max');
                    a.setAttribute('title','maximize');
                    this.each(function(child) {
                        child.get('boundingBox').addClass('hidden');
                    });
                    break;

            }
        },

        //Handler for event 'afterAddChild'
        _afterChildAdded:function(e){
            e.child.set('parent',this);
            e.child.render();//container for rendering this task into is created during rendering
            this._uiSetTaskSkin();
        },

        //Handler for event 'stateChange'
        _afterStateChange:function(e){
            this._uiSetTaskSkin();
        },
        _afterUiStateChange:function(e){
            this._uiSetTaskSkin();

        },
        _afterNameChange:function(e){
                    this._uiSetName();

        },

        GetFullName:function(task,name){
            var p =task.get('parent'),pn;
            if (!Y.Lang.isUndefined(p) ){
                pn = p.get('name');
            }
            else{
                pn = 'taskboard';
            }

            if (pn !== 'taskboard'){
                name = pn +':'+ name;
                return this.GetFullName(p,name);
            }
            else return name;
        },

        //Getting ids of all children of task, including idTask of current task
        _GetIds:function (task,arr){

            arr.push(task.get('id'));

            var taskSize = task.size();
            for(var i=0;i<taskSize;i++)
            {
                var child = task.item(i);
                var childSize = child.size();
                if (childSize > 0)
                    this._GetIds(child,arr);
                else{
                    arr.push(child.get('id'));
                }
            }
            return arr;
        },

        _GetChildrenNames:function(task,arr){
            for(var i=0;i<task.size();i++){
                var child = task.item(i);

                if (child.size()>0) {
                    this._GetChildrenNames(child,arr);
                }
                else {
                    arr.push({
                        name: child.GetFullName(child,child.get("name")),
                        id:child.get('id')
                    });
                }
            }
            return arr;
        },

        _HasPomsDone:function(task){
            var poms = task.get('pomsDone');
            if (poms !== null)
                return true;
            for(var i=0;i<task.size();i++)
            {
                var child = task.item(i);
                if (child.size()>0) {
                    return this._HasPomsDone(child);
                }
                else {
                    var poms = child.get('pomsDone');
                    if (poms !== null)
                        return true;
                }
            }
            return false;
        },

        _HasNotes:function(task){
            var notes = task.get('notes');
            if (notes.length > 0)
                return true;
            for(var i=0;i<task.size();i++)
            {
                var child = task.item(i);
                if (child.size()>0) {
                    return this._HasNotes(child);
                }
                else {
                    var notes = child.get('notes');
                    if (notes.length > 0)
                        return true;
                }
            }
            return false;
        },

        //Handler for event '#taskname a' - collapsing(expanding) tasks
        _onExpandCollapseTasksClick:function(e){
            e.halt();
            var s;
            if (this.get('uiState') === 'expanded')
            {
                this.set('uiState','collapsed');
                s="collapsed";
            }
            else{
                this.set('uiState','expanded');
                s="expanded";
            }
            var dataDB="&state="+s+"&idTask=" + this.get('id');
            this.get('taskBoard').sendDataAjax('change-state',dataDB, null);

        },

        _SetState:function(){
            if (this.get('taskBoard').get('curTaskId') === this.get('id')){
                this.set('state','current')
            }
            else{
                this.set('state','');//changing of skin happens in eventHandler afterStateChange
            }
        },

        _SetStateRec:function(task){
            task.each(function(child){
                if (child.get('state') === 'editing'){
                    child._SetState();
                }
                if (child.size()>0){
                    this._SetStateRec(child)
                }
            })
        },

        _SetOtherInputToHidden:function(){
            this.get('taskBoard').each(function(project) {
                if (project.get('state') === 'editing'){
                    project._SetState();
                }
                project.each(function(task){
                    if (task.get('state') === 'editing'){
                        task._SetState();
                    }
                    if (task.size()>0){
                        this._SetStateRec(task)
                    }
                })
            });
        },

        _onStartEditNameClick:function(e){
            e.halt();
            var state = this.get('state');
            if (state !== 'done' && state !== 'editing' && state !== 'new'){
                this._SetOtherInputToHidden();
                this.set('state','editing');//changing of skin happens in eventHandler afterStateChange
            }
        },

        _AddEditTasksDB:function(){
            var idTask = this.get('id');
            var name = this.get('name');
            var state = this.get('state');
            var notes = this.get('notes');
            if (state === 'new'){
                var parent = this.get('parent');
                var idParent;
                if (parent.get('name') === 'taskboard'){
                    idParent = 'NULL';
                }
                else{
                    idParent = parent.get('id');
                }

                var req = 'add-new-task';

                var jsonTask = Y.JSON.stringify({idTask:idTask, name:name,idParent:idParent});
                var jsonNotes = Y.JSON.stringify(notes);

                var data = "&task="+jsonTask+"&notes=" + jsonNotes;
            }
            else{
                var req = 'edit-taskName';
                var data = "&idTask="+idTask+"&name=" +name;
            }

            this.get('taskBoard').sendDataAjax(req,data, null);
        },

        _FinishEditName:function(e){
            e.halt();
            var state =this.get('state');
            if (state === 'editing' || state === 'new'){
                var i = this.get('contentBox').one('input');
                i.focus();
                if ( ( (e.type==="keydown"&&e.charCode=== 13) || (e.type==="clickoutside" && e.target.get('innerText') !== this.get('name'))) && i.get('value')!== '')
                {
                    function strip_tags( str ){	// Strip HTML and PHP tags from a string
                        return str.replace(/<\/?[^>]+>/gi, '');
                    }     this._uiF
                    var inpName = i.get('value');
                    var name =  strip_tags(inpName);

                    this.set("name", name);//setting name in widget happens in eventHandler afterNameChange

                    //Preparing data for other modules and for server
                    var namesArr=[];
                    if(this.size()>0){
                        namesArr = this._GetChildrenNames(this,[]);
                    }
                    else{
                        namesArr.push({
                            name: this.GetFullName(this, name),
                            id:this.get('id')
                        });
                    }
                    var taskBoard =this.get('taskBoard')
                    taskBoard.notifySandbox("task:editName",namesArr);

                    this._AddEditTasksDB();//sending data to server
                    //we can change state of task only after sending data to server

                    var p = this.get('parent');
                    var pId = p.get('id');
                    var curTaskId = taskBoard.get('curTaskId');
                    var startedTaskId = taskBoard.get('startedTaskId');
                    var id = this.get('id');
                    if (startedTaskId === id){
                        this.set('state','started')
                    }
                    else if (curTaskId === id){
                        this.set('state','current')
                    }
                    else if (curTaskId === pId){
                        this.set('state','current');
                        this._onSetTaskAsCurrent();
                    }
                    else{
                        this.set('state','');//changing of skin happens in eventHandler afterStateChange
                    }
                }
            }
        },

        //Handler for event 'click a.add'
        _onAddTaskClick:function(e){
            e.halt();

            var i = Y.all('#taskboardbody input.visible').size();//Check for enabled inputs

            var id = this.get('id');
            var taskBoard=this.get('taskBoard');
            var startedTaskId = taskBoard.get('startedTaskId');

            var ct = Y.Cookie.get("curTime");

            if (i !== 0){
                this.showInfoMessage('Невозможно добавить (есть редактируемые задачи)');
            }
            else if(ct !==null && id === startedTaskId){
                this.showInfoMessage('Невозможно добавить (задача в процессе выполнения)');
            }
            else {
                var sandbox = this.get('sandbox');
                var notes = this.get('notes');
                var pomsDone = this.get('pomsDone');
                var task = new Y.Task({
                    idParent: id,
                    state:'new',
                    notes:notes,
                    pomsDone:pomsDone,
                    sandbox:sandbox,
                    taskBoard:taskBoard
                });
                task.set('parent',this);

                this.add(task);
                this.set("notes",[]);//notes move to child task
                this.set("pomsDone",null);
                this.set('uiState','expanded');//for changing skin in afterUiStateChange
                var dataNotes =[];
                for(var i in notes){
                    dataNotes.push({idNote:notes[i].idNote});
                }
                if (dataNotes.length > 0){
                    var jsonNotes = Y.JSON.stringify(dataNotes);
                    taskBoard.sendDataAjax('del-notes', '&notes=' + jsonNotes, null);
                }


                if (this.get('state') === 'current'){
                    var dataDB="&state=&idTask=" + id;
                    taskBoard.sendDataAjax('change-state',dataDB, null);
                }
                this.set('state','');//it can be current
                taskBoard.notifySandbox("task:addSubTask", id);
            }
        },

        //Handler for event 'click a.del'
        _onDelTaskClick:function(e){
            e.halt();

            var taskBoard=this.get('taskBoard');
            var curTaskId = taskBoard.get('curTaskId');
            var startedTaskId = taskBoard.get('startedTaskId');
            var ids = this._GetIds(this,[]);
            var res1 = Y.Array.indexOf(ids,startedTaskId);
            var res2 = Y.Array.indexOf(ids,curTaskId);

            if( Y.Cookie.get("curTime") !== null && res1 !==-1){
                this.showInfoMessage('Невозможно удалить (задача или подзадачи в процессе выполнения)');
            }
            else if(res2 !==-1){
                this.showInfoMessage('Невозможно удалить (текущая задача или подзадачи)');
            }
            else if (this._HasPomsDone(this)){
                this.showInfoMessage('Невозможно удалить (задача или подзадачи выполнялись)');
            }
            else if (this._HasNotes(this)){
                this.showInfoMessage('Невозможно удалить (у задачи или ее подзадач есть заметки)');
            }

            else{
                taskBoard.notifySandbox("taskboard:delTask",this);

                var data = Y.JSON.stringify( this._GetIds(this,[]) );
                taskBoard.sendDataAjax('del-tasks','&data=' + data, null);
                var p = this.get('parent');//getting parent befor deleting

                this.remove();
                l = p.size();
                if (p.size() === 0 && p.get('name') !== 'taskboard' ){
                    p.set("uiState", '');
                }
            }
        },

        _onSetTaskAsCurrent:function(e){
            if (!Y.Lang.isUndefined(e)) e.halt();
            var newCurTaskId = this.get("id");
            var taskBoard = this.get('taskBoard');
            var oldCurTaskId = taskBoard.get('curTaskId');

            if (oldCurTaskId !== newCurTaskId){

                if (this.get('state') !== 'started'){
                    this.set('state','current'); //changing of skin in eventHandler afterStateChange
                    //Changing state in DB of two tasks 'old current' and 'new current'
                    var dataDB="&state=current&idTask=" + newCurTaskId;
                    taskBoard.sendDataAjax('change-state',dataDB, null);
                }


                var name = this.GetFullName(this, this.get('name'));
                var notes = this.get('notes');
                var data = {idTask:newCurTaskId,taskName:name,taskNotes:notes};
                taskBoard.notifySandbox("taskboard:taskCurrent",data);
                taskBoard.set('curTaskId',newCurTaskId);

                var task = Y.Widget.getByNode("#"+oldCurTaskId);
                if (task !== null && task.get('state') !== 'started'){

                    task.set('state',''); //changing of skin in eventHandler afterStateChange

                    var dataDB="&state=&idTask=" + oldCurTaskId;
                    taskBoard.sendDataAjax('change-state',dataDB, null);

                }
            }
        },

        showInfoMessage:function(text){
            var node = Y.one('#infoPanel');
            node.set('innerHTML',text);
            YUI().use('transition', function (Y) {
                node.setStyles({'opacity':'1','padding':'3px','background-color': '#faebd7'});
                Y.one('#infoPanel').transition({
                    duration: 5, // seconds
                    easing: 'ease-out',
                    opacity: 0
                }, function() {
                    node.set('innerHTML','');
                    node.setStyles({});
                });
            })
        },
        _onTaskDoneClick:function(e){
            e.halt();
            var taskBoard = this.get('taskBoard');
            var curTaskId = taskBoard.get('curTaskId');
            var startedTaskId = taskBoard.get('startedTaskId');
            var ids = this._GetIds(this,[]);
            var res1 = Y.Array.indexOf(ids,curTaskId);
            var res2 = Y.Array.indexOf(ids,startedTaskId);
            var ct = Y.Cookie.get("curTime");
            if(res1 !== -1){
                this.showInfoMessage('Невозможно перенести в архив (текущая задача или подзадачи)');
            }
            else if(ct !== null && res2 !== -1){
                this.showInfoMessage('Невозможно перенести в архив (задача или подзадачи в процессе выполнения)');
            }
            else{
                this._uiHideMenu(null);
                var id = this.get('id');
                if (curTaskId === id){
                    taskBoard.set('curTaskId',null);
                }

                var data = Y.JSON.stringify( this._GetIds(this,[]) );

                var dataDB="&state=done"+"&data=" + data;
                taskBoard.sendDataAjax('change-state',dataDB, null);

                taskBoard.notifySandbox('taskboard:taskDone',this);

                var state = taskBoard.get("doneTasksState");
                if (state === 'done-hidden'){
                    this.set('state','done-hidden')
                    var f = true;
                }
                else{
                    this.set('state','done');
                }

                if (this.size()>0){
                    function SetChildStateDone(task){
                        var l= task.size();
                        for(var i=0;i<l;i++){
                            var child = task.item(i);
                            if (f){
                                child.set('state','done-hidden');
                            }
                            else{
                                child.set('state','done');
                            }
                            if (child.size()>0){
                                SetChildStateDone(child);
                            }
                        }
                    }
                    SetChildStateDone(this);
                }
            }

        },
        _onTaskRestoreClick:function(e){
            e.halt();
            this._uiHideMenu(null);
            this.set('state','');
            var data=[];
            var name = this.get('parent').get('name');
            data.push(this.get('id'));
            function SetParentRestore(task){
                var p= task.get('parent');
                var ps = p.get('state');
                if (p.get('name') !== 'taskboard' && ps === 'done'){
                    p.set('state','');
                    data.push(p.get('id'));
                    SetParentRestore(p);
                }
            }
            SetParentRestore(this);

            var dataDB="&state=&data=" + Y.JSON.stringify( data);
            this.get('taskBoard').sendDataAjax('change-state',dataDB, null);

        },
        _onStartTaskClick:function(e){
            e.halt();
            var id = this.get("id");
            var taskBoard = this.get('taskBoard');

            if(Y.Cookie.get("curTime") === null) {
                this.set('state','started'); //changing of skin in eventHandler afterStateChange
                taskBoard.set('startedTaskId',id);
                var fullName= this.GetFullName(this, this.get('name'));

                data = {idTask:id,taskName:fullName,time:1500};
                taskBoard.notifySandbox("taskboard:taskStart",data);

                var dataDB="&state=started&idTask=" + id;
                taskBoard.sendDataAjax('change-state',dataDB, null);


                var notes = this.get('notes');
                var data = {idTask:id,taskName:fullName,taskNotes:notes};
                taskBoard.notifySandbox("taskboard:taskCurrent",data);

                var oldCurTaskId=taskBoard.get('curTaskId');
                var task = Y.Widget.getByNode("#"+oldCurTaskId);
                if (task !== null && task.get('state') !== 'started'){

                    task.set('state',''); //changing of skin in eventHandler afterStateChange

                    var dataDB="&state=&idTask=" + oldCurTaskId;
                    taskBoard.sendDataAjax('change-state',dataDB, null);

                }
                taskBoard.set('curTaskId',id);
            }
            else{
                this.showInfoMessage('Завершите текущую задачу либо остановите ее выполнение');
            }

        },

        loadDoneTasks:function(){
            var sandbox =this.get('sandbox');
            var taskBoard =this.get('taskBoard');
            var parentTask=this;
            sandbox.request('load-done-tasks-of-project','&idProject='+this.get('id'),{
                success: function(response){
                    var obj = Y.JSON.parse(response);

                    for(var i in obj){
                        var t = obj[i];
                        var notes = t.notes;
                        if (notes === "" || Y.Lang.isUndefined(notes))  {
                            notes = [];
                        }

                        var task = new Y.Task({
                            id:t.idTask,
                            name:t.name,
                            idParent:  t.idParent,
                            state: 'done',
                            pomsDone:t.pomsDone,
                            uiState: t.uiState,
                            notes:notes,
                            sandbox: sandbox,
                            taskBoard:taskBoard
                        });
                        if (t.idParent === 'NULL') {
                            parentTask.add(task); // rendering of task in eventHandler taskboard_afterChildAdded

                        }
                        else {
                            var node = Y.one('#' + t.idParent);
                            var p = Y.Widget.getByNode(node);
                            if (p !== null)
                                p.add(task);// rendering of task in eventHandler task_afterChildAdded
                        }
                    }
                },

                failure: function(response){
//                    Y.log('sandbox.response - failureConnect');
                }
            });
        },


        toggleDoneTasksStateRec:function (state){

            this.each(function(child) {
                var s = child.get('state') ;

                if (s=== 'done' || s === 'done-hidden') {
                    child.set('state',state);
                }

                if (child.size()>0){
                    child.toggleDoneTasksStateRec(state);
                }

            });
        },

        BOUNDING_TEMPLATE : "<li></li>",
        CONTENT_TEMPLATE : '<div></div>',

        renderUI : function() {
            var name = this.get("name");
            var c = this.get("contentBox");
            var id = this.get('id');
            //While rendering new task we make input visible for entering name of task
            c.setContent("<div id='taskcell-"+id+"' class='taskcell'>"+

                    "<div id='taskname-"+id+"' class='taskname hidden'>"+
                    "<h2 >"+
                    "<a title='minimize' id='minmax-"+id+"' class='min' href='#'></a>"+
                    "<strong>" + name + "</strong>"+
                    "</h2>"+
                    "</div>"+

                    "<div id ='taskmenu-"+id+"' class='taskmenu hidden'>"+
                    "<a title='добавить подзадачу' id='tmadd-"+id+"' href='#'>add|</a>"+
                    "<a title='удалить' id='tmdel-"+id+"' href='#'>del|</a>"+
                    "<a title='перенести в архив' id='tmdone-"+id+"' href='#'>done|</a>"+
                    "<a title='информация о задаче' id='tmmove-"+id+"' href='#'>info|</a>"+
                    "<a title='начать задачу' id='tmstart-"+id+"' href='#'>start</a>"+
                    "<a title='восстановить' class='hidden' id='tmrestore-"+id+"' href='#'>restore</a>"+

                    "</div>"+

                    "<input type='text' value=''>"+

                    "<div class='cleared'></div>"+

                    "</div>"+

                    "<div class='cleared underline hidden' style='border-bottom:1px solid'></div>"
                    );

            //Looking for parent to add HTML content of new (or loaded) task
            var p = this.get('parent');
            var b = this.get("boundingBox");

            if (p.get('name') !== 'taskboard')  //taskboard already has <ul>
            {
                var pc = p.get('contentBox');
                var parentSize = p.size();
                if (parentSize === 1)//while adding first child to task we have to create container node for children
                {
                    cont = Y.Node.create('<ul></ul>');
                    pc.appendChild(cont);
                }
                else//or get container node for adding children
                {
                    cont = pc.one('ul');
                }
                cont.appendChild(b);//adding whole widget task (bounding task) to its parent
            }
            c.one('input').focus();

        },

        bindUI : function() {
            var c = this.get("contentBox");
            var id = this.get('id');
            this.after("stateChange", this._afterStateChange);
            this.after("uiStateChange", this._afterUiStateChange);
            this.after("nameChange", this._afterNameChange);
            this.after('addChild', this._afterChildAdded);
            var tcstr ='#taskcell-'+id;
            Y.on('mouseover', Y.bind(this._uiShowMenu, this),c.one(tcstr));
            Y.on('mouseout', Y.bind(this._uiHideMenu, this),c.one(tcstr));
            Y.on('click', Y.bind(this._onStartEditNameClick, this),c.one('strong'));
            Y.on('key', Y.bind(this._FinishEditName, this), c.one('input'), 'down:13,27');
            Y.on("clickoutside", Y.bind(this._FinishEditName, this), c.one('input'));
            var addstr = "#tmadd-"+id;
            Y.on('click', Y.bind(this._onAddTaskClick, this),c.one(addstr));
            var delstr = "#tmdel-"+id;
            Y.on('click', Y.bind(this._onDelTaskClick, this),c.one(delstr));
            var movestr = "#tmmove-"+id;
            Y.on('click', Y.bind(this._onSetTaskAsCurrent, this),c.one(movestr));
            var startstr = "#tmstart-"+id;
            Y.on('click', Y.bind(this._onStartTaskClick, this),c.one(startstr));
            var donestr = "#tmdone-"+id;
            Y.on('click', Y.bind(this._onTaskDoneClick, this),c.one(donestr));
            var resstr = "#tmrestore-"+id;
            Y.on('click', Y.bind(this._onTaskRestoreClick, this),c.one(resstr));
            var minmaxstr = "#minmax-"+id;
            Y.on('click', Y.bind(this._onExpandCollapseTasksClick, this),c.one(minmaxstr));
        },

        syncUI : function() {
            var state = this.get('state');
            var c = this.get('contentBox');
            var i = c.one('input');
            //Setting skins of loaded tasks
            if (state === 'new'){
                i.addClass('visible');
                i.focus();
            }
            else{
                var id = this.get('id');

                var b = this.get("boundingBox");

                var tnstr = '#taskname-'+id;
                var h = c.one(tnstr);

                i.removeClass('visible');//making input invisible
                h.removeClass('hidden');//making name of task visible
                c.one('.underline').removeClass('hidden');

                if (state === 'current'){ //for task added to curtaskboard
                    h.addClass('current');
                }
                else if (state === 'done'){
                    h.addClass('done');
                }
                else if (state === 'started'){
                    h.addClass('started');
                }
                else if ( state === 'done-hidden'){
                    b.setStyle('display','none');
                    c.one('.underline').addClass('hidden');

                }
                var parentUiState = this.get('parent').get('uiState');
                if (parentUiState === 'collapsed' ){
                    b.addClass('hidden');
                }

                var uiState = this.get('uiState');
                if (uiState === 'collapsed'){
                    var minmaxstr = "#minmax-"+id;
                    var a = c.one(minmaxstr);
                    var tmstr ='#taskmenu-'+id;
                    c.one(tmstr).addClass('hidden');//hidding menu of collapsed task
                    a.replaceClass('min','max');
                    a.setAttribute('title','maximize');
                }
            }
        }

    }, {
        ATTRS : {
            name : {
                value:""
            },
            idParent:{
                value: ""
            },
            state:{
                value:"new"
            },
            uiState:{
                value:""
            },
            pomsDone:{
                value: null
            },
            notes:{
                value: []
            },
            initDoneTasks:{
                value:true
            },
            sandbox:{
                value:null
            },
            taskBoard:{
                value:null
            },
            setter: "_set",
            getter: "_get"
        }
    });

}, '3.1.1' ,{requires:['widget', 'widget-parent', 'widget-child','event-key','json','cookie','dump','anim']});

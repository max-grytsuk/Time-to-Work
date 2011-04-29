YUI.add("arctaskboard", function(Y) {

    Y.ArcTaskBoard = Y.Base.create("arctaskboard", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {

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
            this.get('sandbox').request(type,data, obj,{
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

                var arcTask = new Y.ArcTask({
                    id: t.idTask,
                    idParent:t.idParent,
                    name: t.name,
                    pomsDone:t.pomsDone,
                    notes: notes,
                    state: t.state,
                    sandbox:sandbox,
                    arctaskboard:this
                });

                if (t.idParent === 'NULL') {
                    this.add(arcTask);
                    arcTask.set('uiState','collapsed');
                }
                else {
                    var node = Y.one('#' + t.idParent);
                    var p = Y.Widget.getByNode(node);
                    if (p !== null)
                        p.add(arcTask);
                }
            }
        },

        addArcProject:function(project){

            var arcProject = createArcTask(project,"");
            arcProject.set('uiState','collapsed');
            this.add(arcProject);

            setChildArcTasks(project,arcProject);

            function createArcTask(task, idParent){
                var id = task.get('id');
                var name = task.get('name');
                var notes = task.get('notes');
                var pomsDone = task.get('pomsDone');
                var state = task.get('state');
                var arcTask = new Y.ArcTask({
                    id: id,
                    idParent:idParent,
                    name: name,
                    pomsDone:pomsDone,
                    notes: notes,
                    state: state,
                    sandbox:sandbox,
                    arctaskboard:this
                });
                return arcTask;
            }

            function setChildArcTasks(task, arcTask){
                var l = task.size();
                for(var i=0;i<l;i++){
                    var childTask = task.item(i);
                    var idParent = task.get('id');
                    var arcChildTask = createArcTask(childTask, idParent);
                    arcTask.add(arcChildTask);

                    if (childTask.size()>0) {
                        setChildArcTasks(childTask,arcChildTask);
                    }
                }
            }

        },

        CONTENT_TEMPLATE : "<ul></ul>",

        bindUI : function() {
            this.after('addChild', this._afterChildAdded);
        },

        syncUI : function() {
            function artaskSyncUIRec(artask) {
                artask.syncUI();
                artask.each(function(child) {
                    var s = child.size();
                    if (s > 0 && child.get('state') !== 'collapsed' )
                        artaskSyncUIRec(child);
                    else
                        child.syncUI();
                });
            };
            this.each(function(task) {
                artaskSyncUIRec(task);
            });
        }
    }, {

        ATTRS : {
            name:{
                value:'arctaskboard'
            },
            defaultChildType: {
                value: "Task"
            },
            curTaskId:{
                value: ""
            },
            sandbox: {
                value:null
            }
        }
    });


    Y.ArcTask = Y.Base.create("arctask", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {

        //Handlers for event 'mouseover' 'mouseout'
        _uiShowMenu:function(e){
            var name = this.get('parent').get('name');
            var id = this.get('id');


            var menustr ='#arctaskmenu-'+id;
            var menu = this.get("contentBox").one(menustr);
            menu.removeClass('hidden');

            if (name === 'arctaskboard'){
                var restoremenustr ='#arctmrestore-'+id;
                var restoremenu = this.get("contentBox").one(restoremenustr);
                restoremenu.removeClass('hidden');

            }
        },

        _uiHideMenu:function(e){
            var name = this.get('parent').get('name');
            var id = this.get('id');

            var tmstr ='#arctaskmenu-'+id;
            this.get("contentBox").one(tmstr).addClass('hidden');


        },

        //Changing skin of task
        _uiSetTaskSkin:function(e){
            var id =this.get('id');
            var tnstr ='#arctaskname-'+ id;
            var c = this.get("contentBox");
            var h = c.one(tnstr);

            if (this.size() > 0)
                h.addClass('parent');
            else
                h.removeClass('parent');

            var mmstr = "#arcminmax-" +id;
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
                    var tmstr = '#arctaskmenu-'+id;
                    c.one(tmstr).addClass('hidden');
                    a.replaceClass('min','max');
                    a.setAttribute('title','maximize');
                    this.each(function(child) {
                        child.get('boundingBox').addClass('hidden');
                    });
                    break;
            }
        },
        _afterUiStateChange:function(e){
            this._uiSetTaskSkin();

        },
        _onExpandCollapseArctasksClick:function(e){
            if (this.get('uiState') === 'expanded')
            {
                this.set('uiState','collapsed');
            }
            else{
                this.set('uiState','expanded');
            }
        },
        _uiToggleNotes:function(id,f){
            var notesstr = "#arcnotes-"+id;
            var notes = Y.one(notesstr);

            var nmstr = "#arctmnotes-"+id;
            var nm = Y.one(nmstr);
            if (notes !==null){
                if (f){
                    notes.removeClass('hidden');
                    nm.addClass('arctmnotes-shown');
                }
                else{
                    notes.addClass('hidden');
                    nm.removeClass('arctmnotes-shown');
                }
            }
        },
        _uiShowNotesRec:function(arctask,f){

            if (arctask.size()>0){
                arctask.each(function(child) {
                    if (child.size()>0){
                        this._uiShowNotesRec(child,f);
                    }
                    else{
                        id =child.get('id');
                        child._uiToggleNotes(id,f);
                    }
                })
            }
            else{
                id =arctask.get('id');
                arctask._uiToggleNotes(id,f);
            }
        },
        _onArctaskShowHideNotesClick:function(e){
            if (this.get('uiState') === 'collapsed'){
                this._onExpandCollapseArctasksClick();
            }
            var id = this.get('id');
            var nmstr = "#arctmnotes-"+id;
            var nm = Y.one(nmstr);
            var f;
            if (nm.hasClass('arctmnotes-shown')){
                nm.removeClass('arctmnotes-shown');
                f = false;
            }
            else{
                nm.addClass('arctmnotes-shown');
                f=true;
            }
            this._uiShowNotesRec(this,f);

        },

        //Handler for event 'afterAddChild'
        _afterChildAdded:function(e){
            e.halt();
            e.child.set('parent',this);
            e.child.render(this.get("contentBox"));
            this._uiSetTaskSkin();
        },

        _onArctaskRestoreClick:function(e){

            var dataDB="&state=&idTask=" + this.get('id');//changinng state only for project

            this.get('parent').sendDataAjax('change-state',dataDB, null);
            this.get('parent').notifySandbox('arctaskboard:restoreProject',this);
            this.remove();
        },


        BOUNDING_TEMPLATE : "<li></li>",
        CONTENT_TEMPLATE : '<div></div>',

        renderUI : function() {
            var name = this.get("name");
            var c = this.get("contentBox");
            var id = this.get('id');

            c.setContent("<div id='arctaskcell-"+id+"' class='arctaskcell'>"+

                    "<div id='arctaskname-"+id+"' class='arctaskname'>"+
                    "<h2 >"+
                    "<a title='minimize' id='arcminmax-"+id+"' class='min' href='#'></a>"+
                    "<strong>" + name + "</strong>"+
                    "</h2>"+
                    "</div>"+

                    "<div id ='arctaskmenu-"+id+"' class='arctaskmenu hidden'>"+
                    "<a title='заметки' id='arctmnotes-"+id+"' href='#'>notes|</a>"+
                    "<a title='файлы' id='arctmfiles-"+id+"' href='#'>files|</a>"+
                    "<a title='восстановить' id='arctmrestore-"+id+"' class='hidden' href='#'>restore</a>"+
                    "</div>"+

                    "<div class='cleared'></div>"+

                    "</div>"+

                    "<div class='cleared underline' style='border-bottom:1px solid'></div>"
                    );

            var notes = this.get('notes');

            var notesHtml,noteHtml;
            if (notes.length>0){

                notesHtml = Y.Node.create('<div id="arcnotes-'+id+'" class="arcnotes hidden"><div class="arcnotes-cont-header">Заметки</div><ul></ul></div>');

                for(var i in notes){
                    noteHtml = Y.Node.create('<li>'+'* '+notes[i].noteText+'</li>');
                    notesHtml.one('ul').appendChild(noteHtml);
                }
            }
            if (Y.Lang.isUndefined(notesHtml) )
                notesHtml = null;
            if (notesHtml !== null){
                this.get('contentBox').appendChild(notesHtml);
            }

            //Looking for parent to add HTML content of new (or loaded) task
            var p = this.get('parent');
            var b = this.get("boundingBox");

            if (p.get('name') !== 'arctaskboard')
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
        },

        bindUI : function() {

            var c = this.get("contentBox");
            var id = this.get('id');
            this.after("stateChange", this._afterStateChange);
            this.after("uiStateChange", this._afterUiStateChange);
            this.after('addChild', this._afterChildAdded);
            var tcstr ='#arctaskcell-'+id;
            Y.on('mouseover', Y.bind(this._uiShowMenu, this),c.one(tcstr));
            Y.on('mouseout', Y.bind(this._uiHideMenu, this),c.one(tcstr));
            var notesstr = "#arctmnotes-"+id;
            Y.on('click', Y.bind(this._onArctaskShowHideNotesClick, this),c.one(notesstr));
            var filesstr = "#arctmfiles-"+id;
            Y.on('click', Y.bind(this._onArctaskShowHideFilesClick, this),c.one(filesstr));

            var restorestr = "#arctmrestore-"+id;
            Y.on('click', Y.bind(this._onArctaskRestoreClick, this),c.one(restorestr));
            var minmaxstr = "#arcminmax-"+id;
            Y.on('click', Y.bind(this._onExpandCollapseArctasksClick, this),c.one(minmaxstr));
        }

    }, {
        ATTRS : {
            taskId:{
                value:''
            }          ,
            idParent:{
                value:''
            }          ,
            name : {
                value:""
            },
            uiState:{
                value:""
            },
            pomsDone:{
                value: 0
            },
            notes:{
                value: []
            },
            sandbox:{
                value:null
            },
            arctaskboard:{
                value:null
            }
        }
    });

}, '3.1.1' ,{requires:['widget', 'widget-parent', 'widget-child','event-custom','event-key','json','dump']});

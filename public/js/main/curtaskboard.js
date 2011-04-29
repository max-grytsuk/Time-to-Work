YUI.add("curtaskboard", function(Y) {

    Y.CurTaskBoard = Y.Base.create("curtaskboard", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {


        _afterChildAdded:function(e) {
            e.child.set('parent', this);
            e.child.render(this.get("contentBox"));
        },

        uiSetName:function(size) {
            var name = Y.Lang.trim(this.get("name"));
            var str = this.get('contentBox').one('#taskname-info strong');
            str.setContent(name);

        },

        notifySandbox:function(type, data) {
            this.get('sandbox').notify({
                type: type,
                data: data
            });
        },

        sendDataAjax:function(type, data, obj) {
            this.get('sandbox').request(type, data, obj, {
                success: function(response) {
                },
                failure: function(response) {
                }
            });
        },

        onButtonAddNoteClick:function (e) {
            e.halt();
            var data = {idTask:this.get('connectedTaskId'),taskName:this.get('name')};
            this.notifySandbox('curtaskboard:addNote', data);
        },

        showContent:function (data) {
            Y.one('#curtaskboard').removeClass('hidden');
            this.notifySandbox('curtaskboard:curtaskAdded');//for layout
            this.set('connectedTaskId', data.idTask);
            this.set('name', data.taskName);

            this.removeAll();

            Y.one("#bCollapseExpandNotes a").set("innerHTML", "Скрыть заметки");
            Y.one('#notes-cont-header').set('innerHTML', "");
            var cont = Y.one('#notes');
            if (cont !== null) cont.remove();

            for (var i = 0; i < data.taskNotes.length; i++) {
                var note = new Y.Note({
                    id:data.taskNotes[i].idNote,
                    text:data.taskNotes[i].noteText,
                    state:'new',
                    sandbox: sandbox
                });
                this.add(note);
            }
        },

        changeName:function (data) {

            if (!Y.Lang.isUndefined(data)) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].id === this.get('connectedTaskId')) {
                        this.set('name', data[i].name);
                        break;
                    }
                }
            }
        },

        saveNewNote:function (data) {
            var noteText = data.noteText;
            var note = new Y.Note({
                text:noteText,
                state:'new',
                sandbox: sandbox
            });

            this.add(note);// rendering of new note here
            var notes = [];
            var l = this.size();
            var obj;
            for (var i = 0; i < l; i++) {
                obj = this.item(i);
                notes.push({idNote:obj.get('id'),noteText:obj.get('text')});
            }

            var idTask = this.get('connectedTaskId');
            this.notifySandbox('curtaskboard:modifyNote', {idTask:idTask, notes: notes});
            var idNote = note.get('id');
            var noteState = 'new';
            var dataNote = {idTask:idTask, note: {idNote:idNote, noteText:noteText,noteState:noteState}};
            var jsonStr = Y.JSON.stringify(dataNote);
            var data = "&dataNote=" + jsonStr;

            this.sendDataAjax('add-edit-note', data, null);

        },

        changeNote:function (data) {

            var curNote = this.get('curNote');
            curNote.set('text', data.noteText);

            var notes = [];
            var l = this.size();
            var obj;
            for (var i = 0; i < l; i++) {
                obj = this.item(i);
                notes.push({idNote:obj.get('id'),noteText:obj.get('text')});
            }

            var idTask = this.get('connectedTaskId');
            this.notifySandbox('curtaskboard:modifyNote', {idTask:idTask, notes: notes});

            var idNote = curNote.get('id');
            var noteState = 'exist';
            var dataNotes = {idTask:idTask, note: {idNote:idNote, noteText:data.noteText,noteState:noteState}};
            var jsonStr = Y.JSON.stringify(dataNotes);
            var data = "&dataNote=" + jsonStr;
            this.sendDataAjax('add-edit-note', data, null);

        },


        removeContent:function (id) {
            if (id === this.get('connectedTaskId')) {
                this.set('name', '');
                this.set('connectedTaskId', '');
                this.removeAll();//removing notes
                Y.one('#curtaskboard').addClass('hidden');
                Y.one('#timeboard').addClass('hidden');
                this.notifySandbox('curtaskboard:curtaskremoved');//for block Timer
                return true;
            }
            else{
                return false;
            }
        },

        removeByRef: function (task) {

            var id = task.get('id');
            this.remove(id);
            Y.bind(removeByRefRec,this,task)();

            function removeByRefRec(task){
                for(var i=0;i<task.size();i++)
                {
                    var child = task.item(i);
                    id = child.get('id');
                    if (child.size()>0) {
                        Y.bind(removeByRefRec,this,child)();
                    }
                    else {
                        this.remove(id);
                    }
                }
            }
        },
        onButtonCollapseExpandNotes:function(e) {
            e.halt();
            var n = Y.one('#notes-cont');
            if (n !== null) {
                var node = Y.one("#bCollapseExpandNotes a");
                var txt = node.get("innerHTML");
                if (txt === 'Скрыть заметки') {
                    n.addClass('hidden')
                    node.set("innerHTML", "Показать заметки");
                }
                else {
                    n.removeClass('hidden')
                    node.set("innerHTML", "Скрыть заметки");
                }
            }
        },

        CONTENT_TEMPLATE : "<div></div>",

        renderUI : function() {
            var c = this.get("contentBox");
            c.setContent(
                    "<div id='taskname-info'><h2><strong></strong></h2></div>" +
                            "<h2 id='notes-cont-header'></h2><ul id='notes-cont'></ul>"+
                            "<h2 id='files-cont-header'></h2><ul id='files-cont'></ul>"

                    );
        },

        bindUI : function() {
            this.after('addChild', this._afterChildAdded);
            this.after("nameChange", this.uiSetName);
            Y.on("click", Y.bind(this.onButtonAddNoteClick,this), Y.one("#bAddNote"));
            Y.on("click", Y.bind(this.onButtonCollapseExpandNotes,this), "#bCollapseExpandNotes");
        }
    }, {
        ATTRS : {
            defaultChildType: {
                value: "Note"
            },
            name : {
                value:""
            },
            state:{
                value:""
            },
            curNote: {
                value:null
            },
            sandbox: {
                value:null
            },
            connectedTaskId:{
                value:''
            },
            setter: "_set",

            getter: "_get"
        }
    });


    Y.Note = Y.Base.create("note", Y.Widget, [Y.WidgetChild], {

        //setting short name of task when it's too long
        uiSetText:function() {
            var text = Y.Lang.trim(this.get("text"));
            var shortName = '';
            var str = this.get("contentBox").one('strong');
            if (shortName === '')
                str.setContent(text);
            else
                str.setContent(shortName);
        },

        //Handlers for event 'mouseover' 'mouseout'
        _uiShowMenu:function(e) {
            e.halt();
            var nmstr ='#notemenu-'+this.get('id');
            this.get("contentBox").one(nmstr).removeClass('hidden');
        },

        _uiHideMenu:function(e) {
            e.halt();
            var nmstr ='#notemenu-'+this.get('id');
            this.get("contentBox").one(nmstr).addClass('hidden');
        },

        _afterTextChange:function(e) {
            this.syncUI();
        },

        //Handler for event 'click a.del'
        _onDelNoteClick:function(e) {
            e.halt();
            var curTask = this.get('parent');
            var connectedTaskId = curTask.get('connectedTaskId');
            var idNote = this.get('id');

            this.remove();
            var l = curTask.size();
            var notes = [];
            var obj;
            for (var i = 0; i < l; i++) {
                obj = curTask.item(i);
                notes.push({idNote:obj.get('id'),noteText:obj.get('text')});
            }

            var data = {idTask:connectedTaskId,notes:notes};

            curTask.notifySandbox("curtaskboard:modifyNote", data);
            var jsonNote = Y.JSON.stringify([{'idNote':idNote}]);
            curTask.sendDataAjax('del-notes', '&notes=' + jsonNote, null);
            if (l===0){
                curTask.get('contentBox').one('#notes-cont-header').set('innerHTML', '');
            }
        },

        //Handler for event 'click a.edit'
        _onEditNoteClick:function(e) {
            e.halt();
            var curTask = this.get('parent');
            curTask.set('curNote', this);
            var data = {idTask:curTask.get('connectedTaskId'),taskName:curTask.get('name'),noteText:this.get('text')};
            curTask.notifySandbox("curtaskboard:editNote", data);
        },

        BOUNDING_TEMPLATE : "<li></li>",

        CONTENT_TEMPLATE : '<div></div>',

        renderUI : function() {
            //Y.log("renderNote");
            var text = this.get("text");
            var c = this.get("contentBox");
            var id = this.get('id');
            c.setContent(

                    "<div id='notecell-"+id+"' class='notecell' >" +

                            "<div id='notetext' class='notetext hidden'>" +
                            "<h2 >" +
                            "<strong>" + text + "</strong>" +
                            "</h2>" +
                            "</div>" +

                            "<div id ='notemenu-"+id+"' class='notemenu hidden'>" +
                            "<a title='редактировать' id='nmedit-"+id+"' class='edit' href='#'>edit|</a>" +
                            "<a title='удалить' id='nmdel-"+id+"' class='del' href='#'>del</a>" +
                            "</div>" +

                            "<div class='cleared'></div>" +

                            "</div>" +

                            "<div class='cleared underline' style='border-bottom:1px solid'></div>"

                    );

            var parent = this.get('parent');
            var pc = parent.get('contentBox');
            var parentSize = parent.size();
            var notesCont = pc.one('#notes-cont');
            if (parentSize === 1)
            {
                Y.one('#notes-cont-header').set('innerHTML', "Заметки");
            }

            notesCont.appendChild(this.get("boundingBox"));//adding whole widget note (bounding note) to its parent
        },

        bindUI : function() {
            var c = this.get("contentBox");
            this.after("textChange", this._afterTextChange);
            var id = this.get('id');
            var ncstr ='#notecell-'+id;
            Y.on('mouseover', Y.bind(this._uiShowMenu, this), c.one(ncstr));
            Y.on('mouseout', Y.bind(this._uiHideMenu, this), c.one(ncstr));
            var delstr ='#nmdel-'+id;
            Y.on('click', Y.bind(this._onDelNoteClick, this), this.get("contentBox").one(delstr));
            var editstr ='#nmedit-'+id;
            Y.on('click', Y.bind(this._onEditNoteClick, this), this.get("contentBox").one(editstr));

        },

        syncUI : function() {
            this.uiSetText();
        }

    }, {
        ATTRS : {
            id:{
                value: ""
            },
            text : {
                value:""
            },
            state:{
                value:"new"
            },
            sandbox:{
                value:null
            },
            setter: "_set",

            getter: "_get"
        }
    });

}, '3.1.1', {requires:['widget', 'widget-parent', 'widget-child','event-custom','json-stringify','dump']});

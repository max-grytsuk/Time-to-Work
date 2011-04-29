YUI.add("texteditor", function(Y) {

    function TextEditor(config) {
        TextEditor.superclass.constructor.apply(this, arguments);
    }

    TextEditor.NAME = "textEditor";

    TextEditor.ATTRS = {
        sandbox:{
            value: null
        },
        editor:{
            value: null
        },
        overlay:{
            value: null
        },
        moduleInitializerName:{
            value: ""
        },
        moduleInitializerData:{
            value: null
        }

    };


    Y.extend(TextEditor, Y.Widget, {

        _NotifySandbox:function(type,data){

            this.get('sandbox').notify({
                type: type,
                data: data
            });
        },

        showNoteEditor : function(message) {
            this.set('moduleInitializerName', message.type);
            this.set('moduleInitializerData', message.data);

            var headerContent = "<div >" +
                    "<div style='font-weight:bold'>Заметка к задаче - "+ message.data.taskName + "</div>" +
                    "</div>";

            var overlay = this.get('overlay');
            overlay.set("headerContent", headerContent);

            overlay.show();

            var editor = this.get('editor');
            editor.plug(Y.Plugin.EditorBidi);
            if (editor.getInstance() === null){
                editor.on('frame:ready', function() {
                    if (!Y.Lang.isUndefined(message.data.noteText)){
                        this.getInstance().one('body').set("innerHTML",message.data.noteText);
                    }
                    this.focus();
                });
            }
            else{
                if (!Y.Lang.isUndefined(message.data.noteText)){
                    editor.getInstance().one('body').set("innerHTML",message.data.noteText);
                }
                editor.focus();
            }
        },

        _onSave: function (e){
            e.halt();
            var overlay =this.get('overlay');
            overlay.hide();

            var editor= this.get('editor');
            var noteText = editor.getContent();
            var idTask = this.get('moduleInitializerData').idTask;

            var data = {idTask:idTask,noteText:noteText};
            var mes = this.get('moduleInitializerName');
            switch(this.get('moduleInitializerName')){
                case 'curtaskboard:addNote*':
                    this._NotifySandbox("texteditor:newNoteSave",data);
                    break;
                case 'curtaskboard:editNote*':
                    this._NotifySandbox("texteditor:existingNoteSave",data);
                    break;
            }

            editor.getInstance().one('body').set("innerHTML","");
        },

        _onCancel:function (e){
            e.halt();
            var overlay =this.get('overlay');
            var editor= this.get('editor');
            overlay.hide();
            editor.getInstance().one('body').set("innerHTML","");
        },

        renderUI : function() {
            var footerContent = 	"<div >"+
                    "<input type='button' class='art-button-wrapper' id='bSave' value='Сохранить'>"+
                    "<input type='button' class='art-button-wrapper' id='bCancel' value='Отменить'>"+
                    "</div>";
            var overlay = new Y.Overlay({
                srcNode:"#editorOverlay",
                bodyContent: "",
                footerContent: footerContent,
                visible:false,
                width:"70em",
                height:"32em",
                zIndex:0
            });
            overlay.set("centered", true);
            overlay.render();

            var editor = new Y.EditorBase();
            editor.render('#editorOverlay .yui3-widget-bd');

            this.set('overlay',overlay);
            this.set('editor',editor);

        },

        bindUI : function() {
            var c = this.get('contentBox');
            Y.on("click", Y.bind(this._onSave, this) , Y.one("#bSave"));
            Y.on("click", Y.bind(this._onCancel, this), Y.one("#bCancel"));
        }
    });

    Y.namespace("WJ").TextEditor = TextEditor;

}, "3.1.0", {requires:["widget","editor","overlay","dump","event-key"]});


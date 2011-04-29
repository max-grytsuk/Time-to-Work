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
        init: function() {
            this.startAll();
        },

        start: function(moduleId) {
            var f = true;
            for(var i in startedModules){
                if (startedModules[i] === moduleId){
                    f=false;break;
                }
            }
            if (f){
                moduleData[moduleId].instance = moduleData[moduleId].creator(sandbox,this);
                moduleData[moduleId].instance.init();
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

        commonFunctions:function() {
            return {
                initTable:function(config) {

                    var store = new Ext.data.GroupingStore({
                        reader: new Ext.data.JsonReader({fields: config.field}),
                        data: config.data,
                        sortInfo: {field: 'id', direction: 'ASC'}
                    });



                    var grid = new Ext.grid.GridPanel({
                        store: store,
                        width: 400,
                        region:'center',
                        margins: '0 5 5 5',
                        autoExpandColumn: config.autoExpandColumn,
                        view: new Ext.grid.GroupingView({
                            markDirty: false
                        }),
                        tbar: [{
                            ref: '../removeBtn',
                            iconCls: 'icon-user-delete',
                            text: config.iconText,
                            disabled: true,
                            handler: function(e){
                                var s = grid.getSelectionModel().getSelections();
                                var arr=[];
                                for(var i = 0, r; r = s[i]; i++){
                                    arr.push(r.data);
                                }
                                var json =Ext.encode(arr);
                                Ext.Ajax.request({
                                    url: 'data',
                                    params: {
                                        req: config.reqOnDel,
                                        arr: json
                                    },
                                    success: function(resp,opt) {
                                        if (resp.responseText == 'success'){
                                            for(var i = 0, r; r = s[i]; i++){
                                                store.remove(r);
                                            }
                                        }
                                        else{
                                            Ext.Msg.alert('Status', 'Невозможно удалить');
                                        }
                                    },
                                    failure: function(resp,opt) {

                                    }
                                });
                            }
                        }],

                        columns: config.columns
                    });

                    var layout = new Ext.Panel({
                        title: config.layoutTitle,
                        layout: 'border',
                        layoutConfig: {
                            columns: 1
                        },
                        width:config.layoutWidth,
                        height: 700,
                        items: [grid]
                    });

                    return {store:store,grid:grid,layout:layout};
                }
            }
        }()

    };
}();

core.register("users", function(sandbox) {
    return {
        init: function() {

            Ext.onReady(function(){
                Ext.QuickTips.init();

                var User = Ext.data.Record.create([{
                    name: 'id',
                    type: 'string'
                },
                    {
                        name: 'username',
                        type: 'string'
                    }, {
                        name: 'email',
                        type: 'string'
                    }]);

                Ext.Ajax.request({
                    url: 'data',
                    params: {
                        req:'users'
                    },
                    success: function(resp,opt) {
                        var data = Ext.decode( resp.responseText);
                        initTable(data);
                    },
                    failure: function(resp,opt) {
                    }
                });


                function initTable(data){
                    var columns=  [ new Ext.grid.RowNumberer(),
                        {
                            header: 'id',
                            dataIndex: 'id',
                            width: 50,
                            sortable: true,
                            editor: {
                                xtype: 'textfield',
                                allowBlank: false
                            }
                        },
                        {
                            id: 'username',
                            header: 'UserName',
                            dataIndex: 'username',
                            width: 200,
                            sortable: true,
                            editor: {
                                xtype: 'textfield',
                                allowBlank: false
                            }
                        },{
                            header: 'Email',
                            dataIndex: 'email',
                            width: 200,
                            sortable: true,
                            editor: {
                                xtype: 'textfield',
                                allowBlank: false,
                                vtype: 'email'
                            }
                        }];
                    var config ={
                        data:data,
                        field:User,
                        autoExpandColumn:"username",
                        iconText:"Remove User",
                        reqOnDel:'del-users',
                        columns:columns,
                        layoutTitle:'Users',
                        layoutWidth:400

                    }
                    var o = sandbox.commonFunctions.initTable(config);

                    o.layout.render('usersTable');
                    o.grid.getSelectionModel().on('selectionchange', function(sm){
                        o.grid.removeBtn.setDisabled(sm.getCount() < 1);
                        var s = o.grid.getSelectionModel().getSelections();
                        if (s.length > 0){
                            sandbox.notify({
                                type:'user-sel-changed',
                                data: s[0].data.id
                            })
                        }

                    });
                }

            });
        }//init: function()
    };//return
});//function(sandbox)
core.register("userstasks", function(sandbox) {
    return {
        init: function() {
            var init=true;
            Ext.onReady(function(){
                Ext.QuickTips.init();

                var Task = Ext.data.Record.create([{
                    name: 'id',
                    type: 'int'
                },{
                    name: 'name',
                    type: 'string'
                }, {
                    name: 'idUser',
                    type: 'string'
                }]);
                function ShowTasks(idUser){
                    Ext.Ajax.request({
                        url: 'data',
                        params: {
                            req:'userstasks',
                            idUser:idUser
                        },
                        success: function(resp,opt) {
                            var data = Ext.decode( resp.responseText);

                            o.store.loadData(data);

                            if (init){
                                init = false;
                                initTable(data);
                            }


                        },
                        failure: function(resp,opt) {
                        }
                    });

                }

                var columns= [
                    new Ext.grid.RowNumberer(),
                    {

                        header: 'id',
                        dataIndex: 'id',
                        width: 50,
                        sortable: true,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },
                    {
                        id: 'name',
                        header: 'TaskName',
                        dataIndex: 'name',
                        width: 300,
                        sortable: true,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },{
                        header: 'idUser',
                        dataIndex: 'idUser',
                        width: 50,
                        sortable: true,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false

                        }
                    }];
                var config ={
                    data:{},
                    field:Task,
                    autoExpandColumn:"name",
                    iconText:"Remove Task",
                    reqOnDel:'del-tasks',
                    columns:columns,
                    layoutTitle:'Tasks',
                    layoutWidth:400
                }
                var o = sandbox.commonFunctions.initTable(config);

                o.grid.getSelectionModel().on('selectionchange', function(sm){
                    o.grid.removeBtn.setDisabled(sm.getCount() < 1);
                    var s = o.grid.getSelectionModel().getSelections();
                    if (s.length > 0){
                        sandbox.notify({
                            type:'task-sel-changed',
                            data: s[0].data.id
                        })
                    }
                });



                function initTable(data){

                    o.layout.render('usersTasksTable');
                }

                var handleNotification = function(message) {
                    switch (message.type) {
                        case 'user-sel-changed':
                            ShowTasks(message.data);
                            break;

                    }
                };
                sandbox.listen([
                    'user-sel-changed'
                ], handleNotification);
            });




        }//init: function()
    };//return
});//function(sandbox)
core.register("tasksnotes", function(sandbox) {
    return {
        init: function() {
            var init=true;
            Ext.onReady(function(){
                Ext.QuickTips.init();


                var Note = Ext.data.Record.create([{
                    name: 'id',
                    type: 'int'
                }, {
                    name: 'noteText',
                    type: 'string'
                }]);
                function ShowNotes(idTask){
                    Ext.Ajax.request({
                        url: 'data',
                        params: {
                            req:'tasksnotes',
                            idTask:idTask
                        },
                        success: function(resp,opt) {
                            var data = Ext.decode( resp.responseText);

                            o.store.loadData(data);

                            if (init){
                                init = false;
                                initTable(data);
                            }


                        },
                        failure: function(resp,opt) {
                        }
                    });

                }

                var columns= [
                    new Ext.grid.RowNumberer(),
                    {
                        id: 'id',
                        header: 'id',
                        dataIndex: 'id',
                        width: 50,
                        sortable: true,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },{
                        header: 'noteText',
                        dataIndex: 'noteText',
                        width: 300,
                        sortable: true,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false

                        }
                    }];
                var config ={
                    data:{},
                    field:Note,
                    autoExpandColumn:"id",
                    iconText:"Remove Note",
                    reqOnDel:'del-notes',
                    columns:columns,
                    layoutTitle:'Notes',
                    layoutWidth:400
                }
                var o = sandbox.commonFunctions.initTable(config);

                o.grid.getSelectionModel().on('selectionchange', function(sm){
                    o.grid.removeBtn.setDisabled(sm.getCount() < 1);
                });

                function initTable(data){

                    o.layout.render('usersTasksTable');
                }

                o.grid.getSelectionModel().on('selectionchange', function(sm){
                    o.grid.removeBtn.setDisabled(sm.getCount() < 1);
                });

                function initTable(data){
                    o.layout.render('tasks-notesTable');
                }

                var handleNotification = function(message) {
                    switch (message.type) {
                        case 'task-sel-changed':
                            ShowNotes(message.data);
                            break;
                        case 'user-sel-changed':
                            o.store.loadData({});
                            break;

                    }
                };
                sandbox.listen([
                    'task-sel-changed',
                    'user-sel-changed'
                ], handleNotification);
            });
        }//init: function()
    };//return
});//function(sandbox)

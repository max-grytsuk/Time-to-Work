var basePath = '/time-to-work.net/public/';
YUI({
    filter: 'raw',
    modules: {
        'test-console': {
            fullpath : basePath+'js/tests/test-console.js',
            requires : ['console-filters'],
            skinnable: true
        },

        'skin-sam-test-console': {
            fullpath: basePath+'css/tests/test-console.css',
            type    : 'css'
        },
        'taskboard': {
            fullpath: basePath+'js/main/taskboard.js',
            requires: ['widget', 'widget-parent', 'widget-child','event-custom','event-key','json','cookie','dump','anim']
        },

        'timer':{
            fullpath: basePath+'js/main/timer.js',
            requires: ["widget","cookie",'datatype-date','json-parse']
        }

    },
    useBrowserConsole: false
}).use('taskboard','timer',"test",'test-console', function (Y) {

    Y.on("domready", function() {

        var taskBoard = new Y.TaskBoard();
        var taskboardSuite = new Y.Test.Suite('TaskBoard');
        taskboardSuite.add(new Y.Test.Case({
            name: 'getDataForTimer',

            _should: {
                ignore: {
                }
            },

            setUp: function () {
                this.now = "1356040800"; //"12/21/2012 00:00:00"

            },

            tearDown: function () {
                taskBoard.removeAll();
            },

            'function should return empty array': function () {
                var l = taskBoard.size();
                var data = taskBoard.getDataForTimer(this.now);
                Y.Assert.isArray(data);
                Y.assert(data.length == 0, "The value should be zero.");
            },

            'function should return array with one item': function () {
                var task = new Y.Task({
                    pomsDone:"2012:12:20:23:00:00"
                });
                taskBoard.add(task);
                var data = taskBoard.getDataForTimer(this.now);
                Y.assert(data.length == 1, "The value should be one.");
            },
            'function should return array with two items': function () {
                var task = new Y.Task({
                    pomsDone:"2012:12:20:23:00:00,2012:12:20:23:30:00"
                });
                taskBoard.add(task);
                var data = taskBoard.getDataForTimer(this.now);
                Y.assert(data.length == 2, "The value should be two.");
            },
            'function should return array with two items,when entering three with one wrong': function () {
                var task = new Y.Task({
                    pomsDone:"2012:12:19:23:00:00,2012:12:20:23:00:00,2012:12:20:23:30:00"
                });
                taskBoard.add(task);
                var data = taskBoard.getDataForTimer(this.now);
                Y.assert(data.length == 2, "The value should be two.");
            }

        }));
        Y.Test.Runner.add(taskboardSuite);


        Y.on("click", function(){
            Y.Test.Runner.run();
            Y.WJ.testConsole.clearConsole();
        }, Y.one("#bRunTests"));

    });// "domready",function()
});// function (Y)



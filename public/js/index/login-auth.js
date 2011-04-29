$(function() {
    function CheckLoginData(){
        var username = $("#loginName").val();
        var password = $("#loginPassword").val();

        var node = $('#infoLoginAttempt p');
        if (username === '' && password === ''){}
        else if (username.length < 4){
            node.text('Некоректные данные');
        } else{
           $.ajax({
            type: "POST",
            url: "auth/login",
            data: "username="+username +"&password="+password,
            success: function(msg){
                if (msg === 'success') {
                    location = "main";
                }
                else if (username !== 'demo'){
                        var txt = 'Неправильный логин или пароль. ' + '<a id="newPass" href="#">Забыли пароль?</a>';
                        node.html(txt);
                        $('#newPass').click(function(){
                            $.ajax({
                                type: "POST",
                                url: "auth/recoverpassword",
                                data: "username="+username,

                                success: function(msg){
                                    if (msg === 'success') {
                                       $('#infoLoginAttempt p').html('Для восстановления пароля перейдите по ссылке в высланном вам email');
                                    }
                                    else{
                                      $('#infoLoginAttempt p').html('Данный пользователь не зарегистрирован');
                                    }
                                },
                                failure:function(mes){
                                      $('#infoLoginAttempt p').html('Проблемы на сервере');
                                }
                            });
                        })

                }
            }
        });
        }
    }

    function CheckSignupData() {

        var username = $("#signupName").val();
        var password = $("#signupPassword").val();
        var passwordAgain = $("#signupPasswordAgain").val();
        var email = $("#signupEmail").val();


        var node = $('#infoSignupAttempt p');

        if (username.length <4){
            node.text('Логин меньше 4 символов');
        }
        else if (password.length < 6 ){
            node.text('Пароль меньше 6 символов');
        }
        else if (password !== passwordAgain){
            node.text('Пароли не совпадают');
        }

        else {
            $.ajax({
                type: "POST",
                url: "auth/signup",
                data: "username="+username +"&password="+password+"&email="+email,
                beforeSend:function(){
                    node.text('Проверяем ...');
                },
                success: function(msg){
                    if (msg === 'success') {
                        $("#signupBlock").css("display", "none");
                       node.text('');

                        $("#signupSuccessBlock").css("display", "block");
                    }
                    else if (msg === 'invalidEmail'){
                        node.text('Некорректный email');
                    }
                    else if (msg === '23000'){
                       node.text('Такой логин либо email уже используется');
                    }
                }
            });
        }
        ;
    };

    $("#loginButton").click(CheckLoginData);

    $("#loginBlock").delegate("input", "keydown", function(event){
        if (event.keyCode == '13') {
            CheckLoginData();
        }
    });

    $("#signupButton").click(CheckSignupData);
    $("#signupBlock").delegate("input", "keydown", function(event){
        if (event.keyCode == '13') {
            CheckSignupData();
        }
    });

    $("#signup").click(function(){
        $('#infoSignupAttempt p').text('');
        $("#signupBlock").css("display", "block");
        $("#signupName ").focus();
    })

    $("#signupBlockCloser").click(function(){
        $("#signupBlock").css("display", "none");
        $('#infoSignupAttempt p').text('');
    })
})

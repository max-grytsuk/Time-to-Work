<?php

class Application_Model_LoginClass
{

    function isValid($username, $pass, $reg=false){

        $auth = Zend_Auth::getInstance();

        $application = new Zend_Application(APPLICATION_ENV);

        $bootstrap = $application->getBootstrap();

        $dbAdapter = $bootstrap->getResource('DbAdapter');

        $authAdapter = new Zend_Auth_Adapter_DbTable(
            $dbAdapter,
            'users',
            'username',
            'password'
        );

        $authAdapter
                ->setIdentity($username)
                ->setCredential(md5($pass));

        if (!$reg){
            $this->result=$auth->authenticate($authAdapter);
            if ($this->result->isValid()) {
                Zend_Session::rememberMe(1209600);//14days
                return true;
            }
            else{
                return false;
            }
        }

    }
    function getErrors(){

        if (!$this->result->isValid())
            return $this->result->getMessages();

    }
    function sendLinkToRecoverPassword($username){
        try{

            $users = new Application_Model_DbTable_Users();
            $res= $users->getUserData($username);

            $email = $res['email'];

            if ($email == null){
                return 'no-user';
            } else{
                $activation    =md5($res['password']);
                $subject    = "Восстановление пароля";//тема сообщения
                $message    = "Здравствуйте!
            Перейдите по ссылке, чтобы восстановить пароль:
            http://time-to-work.net/auth/reset/username/".$username."/code/".$activation;

                $mail = new Zend_Mail('utf-8');
                $mail->setBodyText($message);

                $mail->setFrom('admin@time-to-work.net', 'Time-to-Work');
                $mail->addTo($email, $res['username']);
                $mail->setSubject($subject);

                $mail->send();
                return 'success';
            }
        }
        catch (Exception $e) {
            echo $e;

            return "failure";
        }
    }
}

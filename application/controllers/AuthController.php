<?php

/**
 * AuthController
 *
 * @author
 * @version
 */

require_once 'Zend/Controller/Action.php';

class AuthController extends Zend_Controller_Action {

    public function init()
    {
        if ($this->getRequest()->isXmlHttpRequest()) {
            //если AJAX - отключаем авторендеринг шаблонов
            Zend_Controller_Action_HelperBroker::removeHelper('viewRenderer');
            $this->_helper->layout->disableLayout();
        }
    }

    public function loginAction() {

        if (($username = $this->_getParam('username')) && ($password = $this->_getParam('password')) && $this->_request->isPost() )
        {
            $login = new Application_Model_LoginClass();

            if ($login->isValid($username, $password)){
                $this->getResponse()->setHeader("Content-type", 'text/plain');
                $this->getResponse()->setBody("success");
            }

            else{
                $this->getResponse()->setHeader("Content-type", 'text/plain');
                $this->getResponse()->setBody($login->getErrors());
            }
        }
    }
    public function signupAction(){

        $data = $this->_getAllParams();

        if ($data != null && $this->_request->isPost() )
        {
            $users = new Application_Model_DbTable_Users();
            $validator = new Zend_Validate_EmailAddress();

            if ($validator->isValid($data['email'])) {

                $result= $users->addUser($data);
                $login = new Application_Model_LoginClass();
                $password = $data['password'];
                $username = $data['username'];
                if ($result === 'success' && $login->isValid($username, $password)){
                    $to = 'admin@time-to-work.net';
                    $mail = new Zend_Mail('utf-8');
                    $mail->setBodyText('');

                    $mail->setFrom($data['email'], 'Time-to-Work');
                    $mail->addTo($to,  $data['username']);
                    $mail->setSubject('Новый пользователь - ' . $data['username']);
                    $mail->send();
                }
            } else {
                $result='invalidEmail';
            }

            $this->getResponse()->setHeader("Content-type", 'text/plain');
            $this->getResponse()->setBody($result);
        }
    }
    public function logoutAction(){
        Zend_Auth::getInstance()->clearIdentity();
        $this->_redirect('/');
    }
    public function recoverpasswordAction() {

        $username =$this->_getParam('username');
        if ( $username != '' && $this->_request->isPost() )
        {
            $login = new Application_Model_LoginClass();

            $result = $login->sendLinkToRecoverPassword($username);
            if ($result == 'success'){
                $this->getResponse()->setHeader("Content-type", 'text/plain');
                $this->getResponse()->setBody("success");
            }

            else{
                $this->getResponse()->setHeader("Content-type", 'text/plain');
                $this->getResponse()->setBody("failure");
            }
        }
    }
    public function resetAction(){

        $data = $this->_getAllParams();

        if ($data != null)
        {
            $username = $data['username'];
            $code = $data['code'];

            $users = new Application_Model_DbTable_Users();
            $res= $users->getUserData($username);

            if ($code === md5($res['password'])){
                $this->view->username = $username;
                $this->view->email = $res['email'];
                $this->render();
            }
            else {
                $this->_redirect('index');
            }
        }
    }
    public function changeuserdataAction(){
        $data = $this->_getAllParams();

        if ($data != null && $this->_request->isPost() )
        {
            $users = new Application_Model_DbTable_Users();
            $validator = new Zend_Validate_EmailAddress();

            if ($validator->isValid($data['email'])) {
                $result= $users->changeUserData($data);
            } else {
                $result='invalidEmail';
            }

            $this->getResponse()->setHeader("Content-type", 'text/plain');
            $this->getResponse()->setBody($result);
        }
    }
}

	
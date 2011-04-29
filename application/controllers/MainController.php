<?php

/**
 * MainController
 *
 * @author
 * @version
 */

require_once 'Zend/Controller/Action.php';

class MainController extends Zend_Controller_Action {

    public function init()
    {
        if ($this->getRequest()->isXmlHttpRequest()) {
            //если AJAX - отключаем авторендеринг шаблонов
            Zend_Controller_Action_HelperBroker::removeHelper('viewRenderer');
            $this->_helper->layout->disableLayout();
        }
    }

    public function indexAction() {

        $auth = Zend_Auth::getInstance();
        if ($auth->hasIdentity()) {

            $identity =$auth->getIdentity();
            if ($identity === 'admin'){
                $this->_redirect('admin/index');
            }
            else if ($identity === 'tests'){
                $this->_redirect('tests/index');
            }
            else{
                $this->view->username = $identity;
                $this->render();
            }

        }
        else{
            $this->_redirect('index');
        }
    }
    public function tasksAction(){
        $data = $this->_getAllParams();

        if ($data != null && $this->_request->isPost())
        {
            $main = new Application_Model_MainClass();
            $auth = Zend_Auth::getInstance();
            $username = $auth->getIdentity();
            $req=$data['req'];

            if ($username != 'demo' || ($username == 'demo' &&  $req=='load-tasks-to-taskboard')){
                $result= $main->makeRequest($data,$username);
            }else{
                $result='success';
            }

            $this->getResponse()->setHeader("Content-type", 'text/plain');
            $this->getResponse()->setBody($result);
        }
    }
}


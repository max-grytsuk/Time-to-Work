<?php

/**
 * MainController
 *
 * @author
 * @version
 */

require_once 'Zend/Controller/Action.php';

class AdminController extends Zend_Controller_Action {
    /**
     * The default action - show the home page
     */

    public function init()
    {
        if ($this->getRequest()->isXmlHttpRequest()) {
            Zend_Controller_Action_HelperBroker::removeHelper('viewRenderer');
            $this->_helper->layout->disableLayout();
        }
    }

    public function indexAction() {

        $auth = Zend_Auth::getInstance();
        $identity =$auth->getIdentity();
        if ($auth->hasIdentity() && $identity == 'admin') {
            $this->render();
        }
        else{
            $this->_redirect('index');
        }

    }
    public function dataAction() {

        $data = $this->_getAllParams();

        if ($data != null && $this->_request->isPost())
        {
            $admin = new Application_Model_AdminClass();
            $result= $admin->makeRequest($data);
            $this->getResponse()->setHeader("Content-type", 'text/plain');
            $this->getResponse()->setBody($result);
        }
    }
}


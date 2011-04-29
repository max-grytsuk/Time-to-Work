<?php

/**
 * MainController
 *
 * @author
 * @version
 */

require_once 'Zend/Controller/Action.php';

class TestsController extends Zend_Controller_Action {

    public function indexAction() {
        $auth = Zend_Auth::getInstance();
        $identity =$auth->getIdentity();
		if ($auth->hasIdentity() && $identity == 'tests') {

    		$this->render();
		}
		else{
			$this->_redirect('index');
		}
    }
}


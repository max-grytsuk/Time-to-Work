<?php

class IndexController extends Zend_Controller_Action
{

    public function indexAction()
    {
    
		$auth = Zend_Auth::getInstance();
		$this->view->authenticated = false;
		if ($auth->hasIdentity()) {
    		
			$identity = $auth->getIdentity();
			$this->view->username = $identity;
			$this->view->authenticated = true;
		}
				
		$this->render();
    }
      public function techAction()
    {

		$auth = Zend_Auth::getInstance();
		$this->view->authenticated = false;
		if ($auth->hasIdentity()) {

			$identity = $auth->getIdentity();
			$this->view->username = $identity;
			$this->view->authenticated = true;
		}

		$this->render();
    }
    public function aboutAction()
     {

         $auth = Zend_Auth::getInstance();
         $this->view->authenticated = false;
         if ($auth->hasIdentity()) {

             $identity = $auth->getIdentity();
             $this->view->username = $identity;
             $this->view->authenticated = true;
         }

         $this->render();
     }

}




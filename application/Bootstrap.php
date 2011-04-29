<?php

class Bootstrap extends Zend_Application_Bootstrap_Bootstrap
{
protected function _initFirePHP()
    {

        require_once 'FirePHPCore/FirePHP.class.php';
        $firephp = FirePHP::getInstance(true);
        $firephp->registerErrorHandler(
            $throwErrorExceptions=false);
        $firephp->registerExceptionHandler();
        $firephp->registerAssertionHandler(
            $convertAssertionErrorsToExceptions=true,
            $throwAssertionExceptions=false);
        Zend_Registry::set('firephp', $firephp );

        ;

        return $firephp;
    }
protected function _initDbAdapter()
    {

        $config = new Zend_Config_Ini(APPLICATION_PATH . '/configs/application.ini', APPLICATION_ENV);
        $dbAdapter = new Zend_Db_Adapter_Pdo_MySQL($config->database->params);
        Zend_Db_Table::setDefaultAdapter($dbAdapter);

        return $dbAdapter;
    }
    

    protected function _initLogger()
    {
        $writer = new Zend_Log_Writer_Stream(APPLICATION_PATH . '/log.txt');
        $logger = new Zend_Log($writer);
        Zend_Registry::set('logger', $logger);

        return $logger;
    }

}


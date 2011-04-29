<?php

class Application_Model_DbTable_Users extends Zend_Db_Table_Abstract
{
    protected $_name = 'users';

    public function getUserData($username)
    {
        $where = $this->getAdapter()->quoteInto('username = ?', $username);
        $row = $this->fetchRow($where);
        return $row;
    }

    public function getAllUsers()
    {
        $select = $this->select();
        $select->from($this, array('id','username', 'email'));
        $rows = $this->fetchAll($select);

        $resArr =$rows->toArray();
        return $resArr;
    }

    public function addUser($data)
    {
        try {
            $pass = $data['password'];
            $login = $data['username'];
            $dataDB = array(
                'username'      => $login,
                'password' => md5($pass) ,
                'email'      => $data['email']
            );
            $this->insert($dataDB);

            $result="success";
            return $result;
        } catch (Exception $e) {
            $code =$e->getCode();

            switch ($code){
                case "23000":
                    return $code;
                default:
                    return $code;
            }

        }
    }
    public function changeUserData($data){

        try {
            $pass = $data['password'];

            $dataDB = array(
                'password' => md5($pass) ,
                'email'      => $data['email']
            );
            $where = $this->getAdapter()->quoteInto('username = ?', $data['username']);
            $this->update($dataDB,$where);

            $result="success";
            return $result;
        } catch (Exception $e) {
            $code =$e->getCode();

            switch ($code){
                case "23000":
                    return $code;
                default:
                    return $code;
            }

        }
    }
    public function delUser($username){

        try {
            $where = $this->getAdapter()->quoteInto('username = ?', $username);
            $this->delete($where);

            return "success";
        } catch (Exception $e) {
            return "failure";
        }
    }
}


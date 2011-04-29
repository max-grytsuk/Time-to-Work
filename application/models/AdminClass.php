<?php

class Application_Model_AdminClass
{

    public function makeRequest($data){
        $req = $data['req'];
        $users = new Application_Model_DbTable_Users();
        $tasks = new Application_Model_DbTable_Tasks();
        $notes = new Application_Model_DbTable_Notes();
        $tasks_notes = new Application_Model_DbTable_TasksNotes();
        switch ($req) {
            case 'users':
                $usersNames = $users->getAllUsers();
                return json_encode($usersNames);
                break;
            case 'tasks':
                $tasks = $tasks->getAllTasks();
                return json_encode($tasks);
                break;
            case 'userstasks':
                $idUser = Zend_Json::decode( $data['idUser'] );
                $res = $tasks->getAllTasksByUser($idUser);
                return json_encode($res);
                break;
            case 'tasksnotes':
                $idTask = Zend_Json::decode( $data['idTask'] );
                $res = $notes->getNotes($idTask);
                return json_encode($res);
                break;
            case 'del-tasks':
                $arr = Zend_Json::decode( $data['arr'] );
                $n = count($arr);
                for($i=$n-1; $i >=0 ; $i--){
                    $res = $tasks->delTaskById($arr[$i]['id']);
                    if ($res == 'failure')
                        break;
                }
                return $res;
                break;

            case 'del-notes':

                $arr = Zend_Json::decode( $data['arr'] );

                $n = count($arr);
                for($i=$n-1; $i >=0 ; $i--){

                    $tasks_notes->delEntry($arr[$i]['id']);

                    $res=$notes->delNoteById($arr[$i]['id']);

                    if ($res == 'failure')
                        break;
                }
                return $res;
                break;

            case 'del-users':
                $arr = Zend_Json::decode( $data['arr'] );
                $n = count($arr);
                for($i=$n-1; $i >=0 ; $i--){

                    $res=$users->delUser($arr[$i]['username']);
                    if ($res == 'failure')
                        break;
                }
                return $res;

                break;

            default:
                ;
                break;
        }
        return $result;
    }
}


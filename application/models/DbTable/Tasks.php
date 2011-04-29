<?php

class Application_Model_DbTable_Tasks extends Zend_Db_Table_Abstract
{
    protected $_name = 'tasks';
    protected $_sequence = true;
    protected $_primary = 'id';

    public function getTasksByUser($idUser){
        try {

            $select = $this->select()
                    ->where('idUser = ?', $idUser)
                    ->where('state <> ?', 'done')
                    ->where('state <> ?', 'done-hidden')
            ;
            $rows = $this->fetchAll($select);
            $resArr =$rows->toArray();
            return $resArr;

        } catch (Exception $e) {
            return "failure";
        }
    }
    public function getDoneProjectsByUser($idUser){

        try {

            $select = $this->select()
                    ->where('idUser = ?', $idUser)
                    ->where('state = "done"')
            ;

            $rows = $this->fetchAll($select);
            $resArr =$rows->toArray();

            return $resArr;

        } catch (Exception $e) {
        }
    }

    public function getDoneTasksOfProject($idProject){

        try {

            $select = $this->select()
                    ->where('idParent = ?', $idProject)
            ;
            $rows = $this->fetchAll($select);
            $arr =$rows->toArray();

            $resArr =array();
            foreach($arr as $task){
                if ($task['state'] === 'done'){
                    $resArr[]=$task;
                }
            }

            $resArr = $this->getDoneTasksRec($arr, $resArr);

            return $resArr;

        } catch (Exception $e) {
            return "failure";
        }
    }
    private function &getDoneTasksRec($arr, &$resArr){

        foreach($arr as $task){

            $idTask = $task['idTask'];

            $select = $this->select()
                    ->where('idParent = ?', $idTask)
            ;

            $rows = $this->fetchAll($select);
            $selArr =$rows->toArray();

            foreach($selArr as $task){
                if ($task['state'] === 'done'){
                    $resArr[]=$task;
                }
            }
            if (count($arr) > 0  ){
                $resArr = $this->getDoneTasksRec($selArr, $resArr);
            }
        }
        return $resArr;
    }

    public function getAllTasksByUser($idUser){

        try {

            $select = $this->select()
                    ->where('idUser = ?', $idUser)
            ;

            $rows = $this->fetchAll($select);
            $resArr =$rows->toArray();

            return $resArr;

        } catch (Exception $e) {
            return "failure";
        }
    }
    public function getAllTasks(){
        try {

            $select = $this->select();
            $select->from($this, array('id','name', 'idUser'));
            ;

            $rows = $this->fetchAll($select);
            $resArr =$rows->toArray();
            return $resArr;

        } catch (Exception $e) {
            return "failure";
        }
    }

    public function addTask($task,$idUser){

        try {

            $data = array(
                'idTask'	=> 	$task->{'idTask'},
                'name' 		=>	$task->{'name'},
                'idParent'	=> 	$task->{'idParent'},
                'idUser' 	=> 	$idUser
            );

            $this->insert($data);
            return true;
        } catch (Exception $e) {
            return false;
        }

    }
    public function editTaskName($data){

        try {
            $dataDB = array(
                'name' 		=>	$data['name'] ,
            );

            $where = $this->getAdapter()->quoteInto('idTask = ?', $data['idTask']);
            $this->update($dataDB,  $where);

            return "successEditTaskName";
        } catch (Exception $e) {
            return "failure";
        }

    }
    public function getTaskIdDb($idTask){

        try {
            $where = $this->getAdapter()->quoteInto('idTask = ?',$idTask);
            $row = $this->fetchRow($where);
            return $row['id'];
        } catch (Exception $e) {
            return null;
        }
    }
    public function delTasks($data){

        try {
            $arr = Zend_Json::decode( $data['data']);
            $n = count($arr);
            for($i=$n-1; $i >=0 ; $i--){
                $where = $this->getAdapter()->quoteInto('idTask = ?', $arr[$i]);
                $this->delete($where);
            }

            return "successDel";
        } catch (Exception $e) {
            return "failureDel";
        }

    }
    public function delTaskById($id){

        try {
            $select = $this->select();
            $select->from($this, array('idTask'))
                    ->where('id = ?',$id)
            ;

            $obj = $this->fetchAll($select);

            $arr = $obj->toArray();
            $idParent = $arr[0]['idTask'];

            $select2 = $this->select();
            $select2->from($this, array('idTask'))
                    ->where('idParent = ?', $idParent)
            ;

            $rows = $this->fetchAll($select2);
            $arr = $rows->toArray();

            if (count($arr) == 0){
                $where = $this->getAdapter()->quoteInto('id = ?', $id);
                $this->delete($where);

                return "success";
            }else{
                return "failure";
            }

        } catch (Exception $e) {

            return "failure";
        }
    }

    public function editTaskState($data){

        try {
            $state = $data['state'];
            if( isset( $data['idTask']) ) {
                $idTask = $data['idTask'];
            }

            switch ($state){
                case 'expanded':
                case 'collapsed':
                    $dataDB = array(
                        'uiState' 		=>	$state
                    );
                    $this->updateDB($dataDB,$idTask);
                    break;
                case 'current':
                case 'started':
                case '':
                    if( isset( $data['idTask']) ) {
                        $dataDB = array(
                            'state' 		=>	$state
                        );
                        $this->updateDB($dataDB,$idTask);
                    }
                    else{
                        $arr = Zend_Json::decode( $data['data']);
                        $n = count($arr);
                        for($i=0; $i <$n ; $i++){
                            $dataDB = array(
                                'state' 		=>	$state
                            );
                            $this->updateDB($dataDB,$arr[$i]);
                        }
                    }
                    break;

                case 'done':
                case 'done-hidden':
                    $arr = Zend_Json::decode( $data['data']);
                    $n = count($arr);
                    for($i=0; $i <$n ; $i++){
                        $dataDB = array(
                            'state' 		=>	$state
                        );
                        $this->updateDB($dataDB,$arr[$i]);
                    }
                    break;
            }

            return "successEditTaskState";
        } catch (Exception $e) {

            return "failureEditTaskState";
        }

    }
    public function setPomDone($data){

        try {

            $idTask = $data['idTask'];
            $fT = $data['finishTime'];
            $select = $this->select()
                    ->where('idTask = ?', $idTask)
            ;

            $rows = $this->fetchAll($select);

            $res =$rows->toArray();
            $arr = $res [0]['pomsDone'];

            is_null($arr)?$arr =  array():$arr = explode(",", $arr);
            $n =  count($arr) ;
            $f=true;
            if ($n > 0){
                $d1 = explode(":", $arr[$n-1]);//$date - year:month:day:hour:min:sec
                $intD1 = mktime($d1[3],$d1[4], $d1[5], $d1[1], $d1[2], $d1[0]);

                $d2 = explode(":", $fT);//$date - year:month:day:hour:min:sec
                $intD2 = mktime($d2[3],$d2[4], $d2[5], $d2[1], $d2[2], $d2[0]);

                if ($intD2 - $intD1 < 1680) {
                    $f=false;//1680sec = 25min +3min - for cases when the same task was commited at once in two different browsers
                }

            }
            if ($f) {
                array_push($arr, $fT);

                $dataDB = array(
                    'pomsDone' 		=>implode(",",$arr)
                );
                $this->updateDB($dataDB,$idTask);

                return "successSetPomDone";
            }
            else {
                throw  new Exception();
            }
        } catch (Exception $e) {

            return "failureSetPomDone";
        }

    }
    private function updateDB($dataDB,$idTask){
        $where = $this->getAdapter()->quoteInto('idTask = ?', $idTask);
        $this->update($dataDB,  $where);
    }
}




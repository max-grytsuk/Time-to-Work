<?php

class Application_Model_DbTable_TasksNotes extends Zend_Db_Table_Abstract
{
    protected $_name = 'tasks_notes';

    public function addEntry($idNoteDb, $idTaskDb){

        try {

            $data = array(
                'idTaskDb'	=> 	$idTaskDb,
                'idNoteDb' => $idNoteDb
            );
            $this->insert($data);
            return true;

        } catch (Exception $e) {
            echo "failure addEntry in tasks_notes with idNoteDb =" . $idNoteDb.' and idTaskDb ='.$idTaskDb;
            return false;
        }
    }
    public function getAllEntries(){
        try {

            $select = $this->select();
            $select->from($this, array('idTaskDB', 'idNoteDB'));


            $rows = $this->fetchAll($select);
            $resArr =$rows->toArray();
            return $resArr;

        } catch (Exception $e) {
        }
    }
    public function delEntry($idNoteDB){

        try {

            $where = $this->getAdapter()->quoteInto('idNoteDb = ?', $idNoteDB);
            $this->delete($where);
            return true;

        } catch (Exception $e) {
            return false;
        }
    }
    public function delAllEntries(){

        try {

            $this->delete();
            return "successDelAllEntries";
        } catch (Exception $e) {
            return "failureDelAllEntries";
        }
    }}


<?php

class Application_Model_DbTable_Notes extends Zend_Db_Table_Abstract
{
    protected $_name = 'notes';

    public function addNote($note ){

        try {
            $data = array(
                'noteText'	=> 	$note->{'noteText'},
                'idNote' => $note->{'idNote'}
            );
            $this->insert($data);

            return true;

        } catch (Exception $e) {
            return false;
        }
    }
    public function getAllNotes(){
        try {
            $select = $this->select();
            $select->from($this, array('id','noteText'))
            ;

            $rows = $this->fetchAll($select);
            $resArr =$rows->toArray();
            return $resArr;

        } catch (Exception $e) {
            return "failure";
        }
    }
    public function delNote($idNote){

        try {
            $where = $this->getAdapter()->quoteInto('idNote = ?', $idNote);
            $this->delete($where);
            return true;

        } catch (Exception $e) {
            return false;
        }
    }
    public function delNoteById($id){

        try {
            $where = $this->getAdapter()->quoteInto('id = ?', $id);
            $this->delete($where);
            return "success";

        } catch (Exception $e) {
            return "failure";
        }
    }
    public function getNotes($idTask){
        try {
            $select = $this->select(Zend_Db_Table::SELECT_WITH_FROM_PART)
                    ->setIntegrityCheck(false);

            $select
                    ->join('tasks_notes',
                           'tasks_notes.idNoteDb = notes.id',
                           'tasks_notes.idTaskDb'
            )
                    ->where('tasks_notes.idTaskDb = ?', $idTask);

            $rows = $this->fetchAll($select);
            $arr = $rows->toArray();



            foreach($arr as &$line){
                unset($line['idTaskDb']);
            }
            return $arr;

        } catch (Exception $e) {
            return "failure";
        }
    }
    public function editNote($idNote,$noteText){

        try {

            $dataDB = array(
                'noteText' 		=>	$noteText,
            );

            $where = $this->getAdapter()->quoteInto('idNote = ?', $idNote);
            $this->update($dataDB,  $where);

            return "successEditNote";
        } catch (Exception $e) {
            return "failure";
        }

    }

    public function getNoteIdDb($idNote){

        try {
            $where = $this->getAdapter()->quoteInto('idNote = ?',$idNote);
            $row = $this->fetchRow($where);

            return $row['id'];
        } catch (Exception $e) {

            return "getTaskIdDb";
        }

    }
}
//            $sql = $select->__toString();
//            echo "$sql\n";

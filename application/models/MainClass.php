<?php

class Application_Model_MainClass
{

    public function makeRequest($data, $username){
        $req = $data['req'];
        $users = new Application_Model_DbTable_Users();
        $tasks = new Application_Model_DbTable_Tasks();
        $notes = new Application_Model_DbTable_Notes();
        $tasks_notes = new Application_Model_DbTable_TasksNotes();

        switch ($req) {
            case 'load-tasks-to-taskboard':
                $res = $users->getUserData($username);
                $idUser = $res['id'];
                $tasksArr = $tasks->getTasksByUser($idUser);

                foreach ($tasksArr as &$task) {
                    $task['notes'] = $notes->getNotes($task['id']);
                    unset($task['id']);
                    unset($task['idUser']);
                }
                return Zend_Json::encode($tasksArr);
                break;
            case 'load-tasks-to-arctaskboard':
                $res = $users->getUserData($username);
                $idUser = $res['id'];
                $tasksArr = $tasks->getDoneProjectsByUser($idUser);
                foreach ($tasksArr as &$task) {
                    $task['notes'] = $notes->getNotes($task['id']);
                    unset($task['id']);
                    unset($task['idUser']);
                }
                return Zend_Json::encode($tasksArr);
                break;
              case 'load-done-tasks-of-project':
                $idProject = $data['idProject'];
                $tasksArr = $tasks->getDoneTasksOfProject($idProject);
                foreach ($tasksArr as &$task) {
                    $task['notes'] = $notes->getNotes($task['id']);
                    unset($task['id']);
                    unset($task['idUser']);
                }
                return Zend_Json::encode($tasksArr);
                break;
            case 'add-new-task':
                $row = $users->getUserData($username);
                $idUser = $row['id'];

                $taskJSON = json_decode($data['task']);

                $f =$tasks->addTask($taskJSON,$idUser);

                if (isset($data['notes'])){
                    $notesJSON = json_decode($data['notes']);
                    foreach($notesJSON as $noteJSON){
                        $f = $notes->addNote($noteJSON);
                        if ($f){
                            $idNoteDb= $notes->getNoteIdDb($noteJSON->{'idNote'});
                            $idTaskDb = $tasks->getTaskIdDb($taskJSON->{'idTask'});
                            $f = $tasks_notes->addEntry($idNoteDb,$idTaskDb);
                        }
                    }
                }

                if ($f)
                    return "successAddTask";
                else
                    return "failureAddTask";
                break;

            case 'edit-taskName':

                $result =$tasks->editTaskName($data);
                ;
                break;

            case 'del-tasks':
                $result = $tasks->delTasks($data);
                ;
                break;

                break;
            case 'change-state':
                $result = $tasks->editTaskState($data);

                break;

            case 'pom-done':
                $result=$tasks->setPomDone($data);
                break;

            case 'add-edit-note':

                $obj = json_decode($data['dataNote']);
                if ($obj != NULL){
                    $noteState =  $obj->{'note'}->{'noteState'};
                    $idNote = $obj->{'note'}->{'idNote'};
                    $noteText = $obj->{'note'}->{'noteText'};
                    $idTask=$obj->{'idTask'};

                    if ($noteState == 'new'){//adding new note
                        $f = $notes->addNote($obj->{'note'});
                        if ($f){
                            $idNoteDb= $notes->getNoteIdDb($idNote);
                            $idTaskDb = $tasks->getTaskIdDb($idTask);
                            $f = $tasks_notes->addEntry($idNoteDb,$idTaskDb);
                        }

                        if ($f)
                            return "successAddNote";
                        else
                            return "failureAddNote";
                    }
                    else{
                        $result=$notes->editNote($idNote,$noteText);
                        return $result;
                    }
                }
                else{
                    return "failureAddNote";
                }

                break;

            case 'del-notes':

                $notesJSON = json_decode($data['notes']);
                $f=false;
                foreach($notesJSON as $noteJSON){

                    $idNoteDb= $notes->getNoteIdDb($noteJSON->{'idNote'});
                    $f = $tasks_notes->delEntry($idNoteDb);
                    if ($f){
                        $f = $notes->delNote($noteJSON->{'idNote'});
                    }
                }

                if ($f)
                    return "successDelNotes";
                else
                    return "failureDelNotes";
                break;
            default:
                ;
                break;
        }
        return $result;
    }
}

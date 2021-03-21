<!-- Note from Sasha, copy pasted from FAQ -->
<!-- Should I use a database for Module 6?
You can store everything locally in this module. No need to use a database. -->

<?php
    // Content of database.php
    // This connects the database to our php
    $mysqli = new mysqli('localhost', 'nashphp', 'PASSWORD', 'chat_room');

    if($mysqli->connect_errno) {
        printf("Connection Failed: %s\n", $mysqli->connect_error);
        exit;
    }
?>
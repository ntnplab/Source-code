<?php
$filename = 'Data/' . $_POST["filename"] . '.' . uniqid() . ".txt";
$filename = preg_replace('/[^a-z0-9\.]/', '', strtolower($filename));
$myfile = fopen($filename, "w") or die("Unable to open file!");
fwrite($myfile, $_POST["txt"]);
fclose($myfile);
// Code to redirect to the next page would go here
// E.g. header('Location: next.html?pID=' . $_POST["pID"]);
die();
?>
<?php
class DBController {
	private $host = "localhost";
	private $user = "hiCreoFMUser";
	private $password = "xyE0d8D9qe5b6JCP"; 
	private $database = "hicreo_filemanager";
	
	var $conn;
	function __construct() {
		$this->conn = $this->connectDB();
		if(!empty($conn)) {
			$this->selectDB();
		}
	}
	
	function connectDB() {
		// kevin Mar.07.2020
		// for local developer
		if (substr($_SERVER["SERVER_NAME"], 0, 3) === "dev") {
			$conn = mysqli_connect("mysql", $this->user, $this->password, $this->database);

			return $conn;
		}
		// ./ kevin Mar.07.2020
		//$conn = mysql_connect($this->host,$this->user,$this->password);
		$conn = mysqli_connect($this->host, $this->user, $this->password, $this->database);
		return $conn;
	}
	
	function selectDB() {
		mysqli_select_db($this->conn,$this->database);
	}
	
	function runQuery_result($query) {
		$result = mysqli_query($this->conn, $query);
		//Harvey June 25 2019/2612. <mysqli_query result is mysqli_result, not array>.
		if (is_array($result)) {
			
			// while($row=mysqli_fetch_assoc($result)) {
			// 	$resultset[] = $row;
			// }		
			// if(!empty($resultset)) {
			// 	return $resultset;
			// } else { // kevin Apr.10.2019 / i think runQuery_result function does not return empty array anymore if  after change OS and DB
			// 	return null; // kevin Apr.18.2019 / keep watching... return null because $resultset also return null if empty
			// }
			return $result;
		} else {
			
			while($row = mysqli_fetch_assoc($result)) {
				$resultset[] = $row;
			}		
			if(!empty($resultset)) {
				return $resultset;
			} else { // kevin Apr.10.2019 / i think runQuery_result function does not return empty array anymore if  after change OS and DB
				return null; // kevin Apr.18.2019 / keep watching... return null because $resultset also return null if empty
			}
		}
	}
	function runQuery_insert_id($query) {
		$result = mysqli_query($this->conn, $query);
		if(!empty($result))
			return mysqli_insert_id($this->conn);
	}
	function runQuery($query) {
		$result = mysqli_query($this->conn, $query);
		return $result;
	}
	function real_escape_string($str) {
		return mysqli_real_escape_string($this->conn, $str);
	}
	
	function runQuery_get_id($query) {
		$result = mysqli_query($this->conn, $query);
		return mysqli_insert_id($this->conn);
	}
	
	function numRows($query) {
		$result  = mysqli_query($this->conn,$query);
		$rowcount = mysqli_num_rows($result);
		return $rowcount;	
	}
	
}
?>

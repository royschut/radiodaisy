<?php
header("Access-Control-Allow-Origin: *");


if (filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_URL) == "localhost") {
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "radiodaisy";  
} else {
        //I'd like to keep this sort of private :-)
    $servername = "";
    $username = "";
    $password = "";
    $dbname = "";
}

$data = ""; 

function executesql($sql){
    if($sql){
        global $servername, $username, $password, $dbname;
        

        $conn = new mysqli($servername, $username, $password, $dbname) or die ("failed");
        if($conn->connect_error){
            echo json_encode(["success" => false, "message" => "Connection Failed: ".$conn->connect_error]);
        }
        $result = $conn->query($sql);
        $conn->close();
        return $result;
    }
}
function getPlaylistByStyle($style_id){
    global $servername, $username, $password, $dbname;
    //Get from DB

    $sql = "SELECT 
            s.id, s.ytid, s.artist, s.title, s.bpm, s.musicstyle_id, 
            c.id as cue_id, c.cuetime, c.cuetype_id, c.mixtype_id,
            ct.type as cuetype,
            mt.type as mixtype
            FROM tbl_song as s 
            Left JOIN tbl_cue as c on c.song_id = s.id 
            left join tbl_cuetype as ct on ct.id = c.cuetype_id 
            left join tbl_mixtype as mt on mt.id = c.mixtype_id
            where s.musicstyle_id = $style_id AND s.active=1 
            ORDER BY rand()";//s.id";//
    $result = executesql($sql);
    if($result){
        $data = $result->fetch_all(MYSQLI_ASSOC);
        $curid = 0;
        $playlist = [];
        $songI =-1;
        foreach($data as $row) {
            $curCue = [];
            $songI++;
            $curSong = [];
            $playlist[$row['id']]['id']=$row['id'];
            $playlist[$row['id']]['ytid']=$row['ytid'];
            $playlist[$row['id']]['artist']=$row['artist'];
            $playlist[$row['id']]['title']=$row['title'];
            $playlist[$row['id']]['bpm']=$row['bpm'];
            $playlist[$row['id']]['musicstyle_id']=$row['musicstyle_id'];

            $curCue = [];
            $playlist[$row['id']]['cues'][$row['cue_id']]['cuetime'] = $row['cuetime'];
            $playlist[$row['id']]['cues'][$row['cue_id']]['cuetype_id']=$row['cuetype_id'];
            $playlist[$row['id']]['cues'][$row['cue_id']]['mixtype_id'] = $row['mixtype_id'];
            $playlist[$row['id']]['cues'][$row['cue_id']]['cuetype'] = $row['cuetype'];
            $playlist[$row['id']]['cues'][$row['cue_id']]['mixtype'] = $row['mixtype'];
        }
            //make normal array
        function cuesort($a, $b){
            return $a['cuetime']<$b['cuetime']?-1:1;
        }
        $newpl = [];
        foreach($playlist as $song){
            $newcues = usort($song['cues'], "cuesort");
            array_push($newpl, $song);
        }
        return ["success" => true, "data"=> $newpl,"message" => $songI." results - "];
    } else {
        return ["success" => false, "message" => "0 results - ".$sql."==="];
    }
}
function getmusicstyles() {
    global $servername, $username, $password, $dbname;
        //Get from DB
    $sql = "SELECT m.id, m.style, m.urlstring, b.jpg_nr
        FROM tbl_musicstyle as m
        LEFT JOIN tbl_bgr as b ON b.musicstyle_id = m.id
        where active=1 
        ORDER BY m.sortorder";
    $result = executesql($sql);
    if($result){
        $data = $result->fetch_all(MYSQLI_ASSOC);
        return ["success" => true, "data"=> $data,"message" => "Got you your music styles"." results - "];
    } else {
        return ["success" => false, "message" => "0 results - ".$sql."==="];
    }
}
$method = isset($_GET['method']) ? $_GET['method'] : "";

switch($method){
    case "":
        echo json_encode(["sent" => false, "message" => "Recieved no method: "]);
    break;
    case "getplaylistbystyle":
        $style_id = isset($_GET['style_id']) ? $_GET['style_id'] : "0";
        $playlist = getPlaylistByStyle($style_id);
        echo json_encode($playlist);
    break;
    case "insertsong":
            //Get the POSTS
        $request = file_get_contents("php://input");
        $song = json_decode($request, true);
        if($song){
            $songid=0;
            $conn = new mysqli($servername, $username, $password, $dbname) or die ("failed");
            if($conn->connect_error){
                echo json_encode(["success" => false, "message" => "Connection Failed: ".$conn->connect_error]);
            }
            $artist = $conn->real_escape_string($song['artist']);
            $title = $conn->real_escape_string($song['title']);
            $sql = "INSERT INTO tbl_song (ytid, artist, title, bpm, musicstyle_id, active) 
                values ('".$song['ytid']."', '".$artist."', '".$title."', '".$song['bpm']."', '".$song['musicstyle_id']."', '1')";
            $result = $conn->query($sql);
            $totalsql = "-MAIN SQL-".$sql;
            if($result){
                $songid = $conn->insert_id;
                foreach($song['cues'] as $cue) {
                    $sql = "INSERT INTO tbl_cue (song_id, cuetime, cuetype_id, mixtype_id, active) 
                        values ('".$songid."', '".$cue['cuetime']."', '".$cue['cuetype_id']."', '".$cue['mixtype_id']."', '1')";
                    $totalsql .= "-CUE SQL-" . $sql;
                    $result = $conn->query($sql);
                }
            }

            echo json_encode(["success" => true, "id"=>$songid, "message" => "Thanks for sending me!", "sql"=>$totalsql]);
        } else {
            echo json_encode(["success" => false, "message" => "recieved no song ".json_encode($request)]);
        }
    break;
    case "updatesong":
        //Get the POSTS
        $request = file_get_contents("php://input");
        $song = json_decode($request, true);
        if($song){
            $songid=$song['id'];
            $conn = new mysqli($servername, $username, $password, $dbname) or die ("failed");
            if($conn->connect_error){
                echo json_encode(["success" => false, "message" => "Connection Failed: ".$conn->connect_error]);
            }
            $artist = $conn->real_escape_string($song['artist']);
            $title = $conn->real_escape_string($song['title']);
            $sql = "UPDATE tbl_song
                SET ytid='".$song['ytid']."', 
                    artist='".$artist."', 
                    title='".$title."', 
                    bpm='".$song['bpm']."', 
                    musicstyle_id='".$song['musicstyle_id']."', 
                    active= '1'
                WHERE id='$songid'";
            $result = $conn->query($sql);
            $totalsql = "-MAIN SQL-$sql";    
            $sql = "
            DELETE from tbl_cue 
            WHERE song_id = $songid";
            $totalsql .= "-DEL CUES-".$sql;
            $result = $conn->query($sql);
            foreach($song['cues'] as $cue) {
                $sql = "INSERT INTO tbl_cue (song_id, cuetime, cuetype_id, mixtype_id, active) 
                    values ('".$songid."', '".$cue['cuetime']."', '".$cue['cuetype_id']."', '".$cue['mixtype_id']."', '1')";
                $totalsql .= "-CUE SQL-" . $sql;
                $result = $conn->query($sql);
            }

            echo json_encode(["success" => true, "id"=>$songid, "message" => "Thanks for sending me!", "sql"=>$totalsql]);
        } else {
            echo json_encode(["success" => false, "message" => "recieved no song ".json_encode($request)]);
        }
    break;
    case "getmusicstyles":
        $musicstyles = getmusicstyles();
        echo json_encode($musicstyles);
    break;
}
?>
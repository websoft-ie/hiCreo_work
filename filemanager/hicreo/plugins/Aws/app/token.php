<?php

require 'app/start.php';

$object = 'uploads/Beautiful_Fashion_Female.jpg';

$url = $s3->getObjectUrl($config['s3']['bucket'], $object, '+10 seconds');

?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Token</title>
    </head>
    <body>
        <a href="<?php echo $url; ?>" download="<?php echo $object['Key']; ?>">Download</a>
        
    </body>
</html>  
<?php


require 'app/start.php';

$objects = $s3->getIterator('ListObjects',[
    'Bucket' => $config['s3']['bucket']
]);

//var_dump($objects);

?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Listings</title>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Image</th>
                    <th>Download</th>
            </thead>
            <tbody>
            <?php foreach($objects as $object): ?>
            <?php //var_dump($object); ?>
                <tr>
                    <th><?php echo $object['Key']; ?></th>
                    <th><img src="<?php echo $s3->getObjectUrl($config['s3']['bucket'], $object['Key']); ?>" style="width:300px;"></th>
                    <th><a href="<?php echo $s3->getObjectUrl($config['s3']['bucket'], $object['Key']); ?>" download="<?php echo $object['Key']; ?>">Download</a></th>
            <?php endforeach; ?>        
            </tbody>
        </table>
        
    </body>
</html>    
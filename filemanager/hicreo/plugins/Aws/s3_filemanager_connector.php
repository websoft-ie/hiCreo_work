<?php
use Aws\S3\S3Client;

require 'vendor/autoload.php';

$config = [
    's3' => [
        'key' => 'AKIAZG6KVS5RUMHLCB46',
        'secret' => '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',
        'bucket' => 'filemanager.hicreo.com'
    ]
];

//S3
$s3 = S3Client::factory([
    'key' => $config['s3']['key'],
    'secret' => $config['s3']['secret']
]);    
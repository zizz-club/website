<!-- This is a test file, it has no meaningful use besides being a redirecting link -->

<?php
    $page = 'panel';
    $title = 'zizz.club | ' . ucfirst($page);
?>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $title; ?></title>
    <style>
        body {
            width: 100%;
            height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #606060;
        }
        #back-btn {
            transform: scale(1);
            transition: transform 0.2s;
        }
        #back-btn:hover {
            transform: scale(1.05);
        }
        .wrapper {
            margin: 16px;
        }
        .box {
            background-color: #aaaaaa;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid #ccc;
            padding: 16px 24px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="box">
            <h1><?php echo ucfirst($page); ?></h1>
            <p>This is a test page</p>
            <p>It has no meaningful use besides being a redirecting link</p>
        </div>
    </div>
    <a id="back-btn" class="box" href="javascript:void(0)" onclick="window.history.back()">Back</a>
</body>
</html>
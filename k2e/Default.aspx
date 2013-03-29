﻿<%@ Page Title="Home Page" Language="C#"
    Inherits="k2e._Default" %>

<!DOCTYPE html>
<html>
	<head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>k2e</title>
        <link rel="shortcut icon" href="deploy/assets/favicon.ico"/>
        <!-- -->
        <meta http-equiv="Content-Type" content="text/html; charset=utf8"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        <!-- css -->
        <link href="deploy/build/enyo.css" rel="stylesheet"/>
        <link href="deploy/build/app.css" rel="stylesheet"/>
        <!-- js -->
        <script src="deploy/build/enyo.js"></script>
        <script src="deploy/build/app.js"></script>
	</head>
	<body class="enyo-unselectable">
		<script>
		    if (!window.k2e.App) {
		        alert('No application build found, redirecting to debug.html.');
		        location = 'debug.html';
		    }
		    new k2e.App().renderInto(document.body);
		</script>
	</body>
</html>
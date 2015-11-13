<%@ Page Title="Home Page" Language="C#"
    Inherits="k2e.Default" %>

<!DOCTYPE html>
<html>
	<head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="theme-color" content="#4c4c4c">
        <title>k2e</title>
        <link rel="shortcut icon" href="assets/favicon.ico"/>
        <!-- -->
        <meta http-equiv="Content-Type" content="text/html; charset=utf8"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        <!-- css -->
        <link href="build/enyo.css" rel="stylesheet" media="screen" />
        <link href="build/app.css" rel="stylesheet" media="screen" />
        <link href="build/print.css" rel="stylesheet" media="print" />
        <!-- js -->
        <script src="build/polyfill.min.js"></script>
        <script src="https://use.typekit.net/lop6oji.js"></script>
        <script>try{Typekit.promise=new Promise(function(a,b){Typekit.load({async:!0,active:a,inactive:b})})}catch(e){}</script>
        <script src="build/enyo.js"></script>
        <script src="build/app.js"></script>
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
<%@ Page Title="Home Page" Language="C#"
    Inherits="k2e.Default" %>

<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>k2e</title>
        <link rel="shortcut icon" href="assets/favicon.ico"/>
        <!-- -->
        <meta http-equiv="Content-Type" content="text/html; charset=utf8"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        <script src="http://localhost:35729/livereload.js"></script>
        <!-- Less.js (uncomment for client-side rendering of less stylesheets; leave commented to use only CSS) -->
        <!-- <script src="enyo/tools/minifier/node_modules/less/dist/less-1.3.0e.min.js"></script> -->
        <!-- enyo (debug) -->
        <script src="bootplate/enyo/enyo.js"></script>
        <!-- application (debug) -->
        <script src="bootplate/source/package.js" type="text/javascript"></script>
    </head>
    <body class="enyo-unselectable">
        <script>
            var app = new k2e.App().renderInto(document.body);
        </script>
    </body>
</html>
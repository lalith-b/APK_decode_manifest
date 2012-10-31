//****************************************************************************
// Copyright (c) 2012 Lalith Balasubramanian (ICRL)
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// *****************************************************************************/

var sys        = require('sys'),
    path       = require('path'),
    http 	   = require('http');
    formidable = require('./lib/formidable'),
    paperboy   = require('./lib/paperboy');
var fs = require('fs'); 

// import the settings file to configure environment
var SETTINGS = fs.readFileSync('./config/settings.json');
	SETTINGS = JSON.parse(SETTINGS);
	
var ShellProvider = require('./providers/ShellProvider').ShellProvider;
var SocketProvider = require('./providers/SocketProvider').SocketProvider;

var PUBLIC = path.join(path.dirname(__filename), 'public');

var progresses = {}
var metadata   = {}

http.createServer(function(req, res) {

//   if(req.url == "/get_list" && req.method.toLowerCase() == 'post'){  
  if(req.url == "/get_list"){
	  var shellProvider = new ShellProvider();
	  shellProvider.get_files(function(results) {
		  res.writeHead(200,{'Content-Type':'application/json'});	  
		  res.write(results);
		  res.end();
	  });	  
  }
  
  if(req.url == "/output/*"){
     console.log("loading url -- "+req.url);
  }

// parse an upload using formidable.
  regex = new RegExp('/upload/(.+)');
  match = regex.exec(req.url);
  
  if (match && req.method.toLowerCase() == 'post') {
    var uuid = match[1];
    sys.print("receiving upload: "+uuid+'\n');

    var form = new formidable.IncomingForm();
    form.uploadDir = './data';
    form.keepExtensions = true;

    // keep track of progress.
    form.addListener('progress', function(recvd, expected) {
      progress = (recvd / expected * 100).toFixed(2);
      progresses[uuid] = progress
    });

    form.parse(req, function(error, fields, files) {
		sys.print("finished upload: "+uuid+'\n');
		var shellProvider = new ShellProvider();
		shellProvider.execute_conversion(files,function(results) {
		   res.writeHead(200, {'content-type': 'application/json'});
		   res.write(results);
		   res.end();	
		});

		if(error){
	      res.writeHead(200, {'content-type': 'application/json'});
		  res.write("Document has the following error "+error+" I dont know how to fix this will find out soon dont cry :P--");
		  res.end();
		}  		
	});
    return;
  }

  // (update) metadata
  regex = new RegExp('/update/(.+)');
  match = regex.exec(req.url);
  if (match && req.method.toLowerCase() == 'post') {
    uuid = match[1];
    var form = new formidable.IncomingForm();
    form.addListener('field', function(name, value) {
      sys.print("fresh metadata for "+uuid+": "+name+" => "+value+"\n")
      metadata[name] = value;
    });
    form.parse(req);
  }

  // respond to progress queries.
  regex = new RegExp('/progress/(.+)');
  match = regex.exec(req.url);
  if (match) {
    uuid = match[1];
    res.writeHead(200, {'content-type': 'application/json'});
    res.write(JSON.stringify({'progress': progresses[uuid]}));
    res.end();
  }

  // let paperboy handle any static content.
  paperboy
    .deliver(PUBLIC, req, res)
    .after(function(statCode) {
      sys.log('Served Request: ' + statCode + ' ' + req.url);
    })
    .otherwise(function() {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.write('Not Found');
      res.end();
    });
 
}).listen(SETTINGS.port,SETTINGS.host);

sys.log("running at http://"+SETTINGS.host+":"+SETTINGS.port);